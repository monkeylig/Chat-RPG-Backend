const {FieldValue} = require("../data-source/backend-data-source");
const Schema = require("./datasource-schema");
const GameModes = require("./game-modes");
const chatRPGUtility = require('./utility');
const {Player} = require('./datastore-objects/agent');
const Game = require('./datastore-objects/game');
const { BattlePlayer, BattleMonster } = require("./datastore-objects/battle-agent");
const Item = require('./datastore-objects/item');
const {MonsterClass} = require("./datastore-objects/monster-class");
const {Weapon} = require("./datastore-objects/weapon");
const { Shop } = require("./datastore-objects/shop");
const BattleFunctions = require('./battle/battle')
const ChatRPGErrors = require('./errors');
const { InventoryPage } = require("./datastore-objects/inventory-page");

class ChatRPG {
    #datasource;
    
    static Platforms = {
        Twitch: 'twitch'
    }

    constructor(datasource) {
        this.#datasource = datasource;
    }

    async getStartingAvatars() {
        const avatars = await this.#datasource.collection(Schema.Collections.Avatars).doc(Schema.AvatarDocuments.StartingAvatars).get();
        const avatarData = avatars.data();

        if (avatarData) {
            return avatarData[Schema.AvatarFields.Content];
        }
        
        return [];
    }

    async addNewPlayer(name, avatar, platformId, platform) {

        const platformIdProperty = this.#getPlatformIdProperty(platform);

        const playersRef = this.#datasource.collection(Schema.Collections.Accounts);
        const querySnap = await playersRef.where(platformIdProperty, '==', platformId).get();

        if(!querySnap.empty) {
            throw new Error(ChatRPGErrors.playerExists);
        }

        const player = new Player({name, avatar, [platformIdProperty]: platformId});

        player.addItemToBag(chatRPGUtility.startingItems.items.potion);
        player.addItemToBag(chatRPGUtility.startingItems.items.phoenixDown);
        player.addBookToBag(chatRPGUtility.startingItems.books.warriorMasteryI);
        player.addBookToBag(chatRPGUtility.startingItems.books.wizardMasteryI);

        const newPlayer = playersRef.doc();
        await newPlayer.set(player.getData());

        return newPlayer.id;
    }

    async findPlayerById(id, platform) {
        let playerSnap;
        if(platform) {
            playerSnap = await this.#findPlayerbyPlatformId(id, platform);
        }
        else {
            playerSnap = await this.#findPlayer(id);
        }
    
        const player = new Player(playerSnap.data());
        return this.#returnPlayerResponce(player, playerSnap.ref.id);
    }

    async joinGame(playerId, gameId) {
        //Make sure the user exists
        const playerSnap = await this.#findPlayer(playerId);
        const player = new Player(playerSnap.data());

        const gameRef = this.#datasource.collection(Schema.Collections.Games).doc(gameId);
    
        let game;
        try {
            game = await this.#datasource.runTransaction(async (transaction) => {
                const transGameSnap = await transaction.get(gameRef);
                if(!transGameSnap.exists) {
                    //TODO Use the host's game mode from the config
                    const game = await GameModes.arena.createGame(this.#datasource);
                    game.onPlayerJoin(player);
                    transaction.create(gameRef, game.getData());
                    return game;
                }

                const game = new Game(transGameSnap.data());
                game.onPlayerJoin(player);
                transaction.update(gameRef, {trackers: game.getData().trackers})
                return game;
            });
        } catch (error) {
            console.error(error);
        }

        await playerSnap.ref.update({ currentGameId: gameId });
        player.datastoreObject.currentGameId = gameId;

        const gameData = game.getData();
        gameData.id = gameId;

        return gameData;
    }

    async getGame(gameId) {
        const game = new Game((await this.#findGame(gameId)).data());
        const gameData = game.getData();
        gameData.id = gameId;

        return gameData;
    }

    async startBattle(playerId, gameId, monsterId, fallbackMonster) {
        const playerSnap = await this.#findPlayer(playerId);
        const gameSnap = await this.#findGame(gameId);
        const game = new Game(gameSnap.data());

        const playerData = playerSnap.data();
        if(playerData.currentGameId != gameSnap.ref.id) {
            throw new Error(ChatRPGErrors.playerNotInGame);
        }

        let targetMonsterData = game.findMonsterById(monsterId, false);
        if(!targetMonsterData) {
            if(fallbackMonster) {
                const monsterRef = await this.#datasource.collection('monsters').doc(fallbackMonster.monsterClass).get();
                const monsterClass = new MonsterClass(monsterRef.data());
                targetMonsterData = monsterClass.createMonsterInstance(fallbackMonster.level).datastoreObject;
                targetMonsterData.id = monsterId;
            }
            else {
                throw new Error(ChatRPGErrors.monsterInstanceNotFound);
            }
        }

        const player = new Player(playerData);
        player.datastoreObject.id = playerSnap.ref.id;
        const battlePlayer = new BattlePlayer(player.datastoreObject);
        const battleMonster = new BattleMonster(targetMonsterData);

        const battle = {
            player: battlePlayer.datastoreObject,
            monster: battleMonster.datastoreObject,
            gameId: gameSnap.ref.id,
            strikeAnim: chatRPGUtility.strikeAnim,
            environment: {},
            round: 1,
            active: true
        };

        const battleRef = this.#datasource.collection(Schema.Collections.Battles).doc();
        await battleRef.set(battle);

        battle.id = battleRef.id;

        return battle;
    }

    async battleAction(battleId, actionRequest) {
        const battleSnap = await this.#datasource.collection(Schema.Collections.Battles).doc(battleId).get();

        if(!battleSnap.exists) {
            throw new Error(ChatRPGErrors.battleNotFound);
        }

        const battle = battleSnap.data();
        const steps = BattleFunctions.singlePlayerBattleIteration(battle, actionRequest);

        const battlePlayer = new BattlePlayer(battle.player);
        const battlePlayerData = battlePlayer.datastoreObject;
        const monster = new BattleMonster(battle.monster);
        const monsterData = monster.getData();

        if(!battle.active) {
            const playerRef = this.#datasource.collection(Schema.Collections.Accounts).doc(battlePlayerData.id);
            const player = new Player((await playerRef.get()).data());
           if(battlePlayer.isDefeated()) {
                player.onPlayerDefeated();
            }
            else if(monster.isDefeated()) {
                const oldLevel = battlePlayer.getData().level;
                const lastDrop = {
                    weapons: []
                };

                for (const drop of battle.result.drops) {
                    switch (drop.type) {
                        case 'weapon':
                            if(!player.addWeaponToBag(new Weapon(monsterData.weapon))) {
                                drop.bagFull = true;
                                lastDrop.weapons.push(monsterData.weapon);
                            }
                            break;
                    }
                }

                if(lastDrop.weapons.length) {
                    player.setLastDrop(lastDrop);
                }

                player.onMonsterDefeated();
                
                // Remove the monster from the game
                const gameSnap = await this.#findGame(battle.gameId);
                let game = new Game(gameSnap.data());
                
                // Skip transaction if it is unnessesary
                if(game.findMonsterById(monsterData.id, false)) {
                    try {
                        await this.#datasource.runTransaction(async (transaction) => {
                            const transGameSnap = await transaction.get(gameSnap.ref);
                            
                            game = new Game(transGameSnap.data());
                            game.onPlayerLevelUp(oldLevel, player);
                            const transMonster = game.findMonsterById(monsterData.id);
                            if(!transMonster) {
                                return;
                            }
                            
                            game.removeMonster(monsterData.id);
                            await GameModes.arena.onMonsterDefeated(game, monster, this.#datasource);
                            transaction.update(transGameSnap.ref, {trackers: game.getData().trackers, monsters: game.getMonsters()});
                        });
                    } catch(error) {
                        console.error(error);
                    }
                }
            }

            await this.#finishBattle(battleSnap.ref, playerRef, player, battlePlayer);
            return {player: battlePlayerData, monster: monsterData, steps, result: battle.result};
        }

        await battleSnap.ref.set(battle);

        return {player: battle.player, monster: battle.monster, turn: battle.round - 1, steps};
    }

    async #finishBattle(battleRef, playerRef, player, battlePlayer) {
        player.mergeBattlePlayer(battlePlayer);
        await playerRef.set(player.getData());
        await battleRef.delete();
    }

    async equipWeapon(playerId, weaponId) {
        const playerRef = this.#datasource.collection(Schema.Collections.Accounts).doc(playerId);
        const player = await this.#datasource.runTransaction(async (transaction) => {
            const playerSnap = await transaction.get(playerRef);

            if(!playerSnap.exists) {
                throw new Error(ChatRPGErrors.playerNotFound);
            }

            const player = new Player(playerSnap.data());
            
            if(!player.equipWeaponFromBag(weaponId)) {
                throw new Error(ChatRPGErrors.weaponNotInBag);
            }

            transaction.update(playerRef, player.getData());
            return player;
        });
        return this.#returnPlayerResponce(player, playerId);
    }

    async dropObjectFromBag(playerId, objectId) {

        let player;
        const playerRef = this.#datasource.collection(Schema.Collections.Accounts).doc(playerId);
        await this.#datasource.runTransaction(async (transaction) => {
            const playerSnap = await transaction.get(playerRef);

            if(!playerSnap.exists) {
                throw new ChatRPGErrors.playerNotFound;
            }

            player = new Player(playerSnap.data());

            const bagObject = player.findObjectInBag(objectId);
            if(!bagObject) {
                throw new ChatRPGErrors.objectNotInBag;
            }

            transaction.update(playerRef, {'bag.objects': FieldValue.arrayRemove(bagObject)});

        });

        player.dropObjectFromBag(objectId);
        return this.#returnPlayerResponce(player, playerId);
    }

    async equipAbility(playerId, abilityBookName, abilityIndex, replacedAbilityName) {

        const playerSnap = await this.#findPlayer(playerId);
        const playerData = playerSnap.data();
        const player = new Player(playerData);
        const book = player.findBookByName(abilityBookName, false);

        if(!book) {
            throw new Error(ChatRPGErrors.bookNotInBag);
        }

        if(abilityIndex >= book.abilities.length || abilityIndex < 0) {
            throw new Error(ChatRPGErrors.badAbilityBookIndex);
        }

        if(!player.abilityRequirementMet(book, abilityIndex)) {
            throw new Error(ChatRPGErrors.abilityRequirementNotMet);
        }

        const abilityBookEntry = book.abilities[abilityIndex];

        let replacedAbility;

        if(replacedAbilityName) {
            replacedAbility = player.findAbilityByName(replacedAbilityName);

            if(!replacedAbility) {
                throw new Error(ChatRPGErrors.abilityNotFound);
            }
        }
        else if(!player.hasOpenAbilitySlot()) {
            throw new Error(ChatRPGErrors.abilitiesFull);
        }

        await this.#datasource.runTransaction(async (transaction) => {

            if(replacedAbility) {
                transaction.update(playerSnap.ref, {'abilities': FieldValue.arrayRemove(replacedAbility)});
            }
            transaction.update(playerSnap.ref, {'abilities': FieldValue.arrayUnion(abilityBookEntry.ability)});
        });

        player.equipAbility(abilityBookEntry.ability, replacedAbilityName);
        return this.#returnPlayerResponce(player, playerId);
    }

    async getShop(shopId) {
        const shopSnapshot = await this.#findShop(shopId);

        //Sanitize data from the datastore
        const shop = new Shop(shopSnapshot.data());

        const shopData = shop.getData();
        shopData.id = shopId;
        return shopData;
    }

    async buy(playerId, shopId, productId) {
        const shopSnapshot = await this.#findShop(shopId);

        const shop = new Shop(shopSnapshot.data());
        const shopItem = shop.findProduct(productId);

        if(!shopItem) {
            throw new Error(ChatRPGErrors.productNotFound);
        }

        const playerRef = this.#datasource.collection(Schema.Collections.Accounts).doc(playerId);
        const player = await this.#datasource.runTransaction(async (transaction) => {
            const playerSnap = await transaction.get(playerRef);

            if(!playerSnap.exists) {
                throw new Error(ChatRPGErrors.playerNotFound);
            }

            const player = new Player(playerSnap.data());

            if(player.getData().coins < shopItem.getData().price) {
                throw new Error(ChatRPGErrors.insufficientFunds);
            }

            player.getData().coins -= shopItem.getData().price;


            if(player.getData().bag.objects.length >= player.getData().bag.capacity) {
                player.getData().bag.capacity += 1;
            }

            switch(shopItem.getData().type) {
                case 'weapon':
                    player.addWeaponToBag(new Weapon(shopItem.getData().product));
                    break;
                case 'item':
                    player.addItemToBag(new Item(shopItem.getData().product));
                    break;
            }

            transaction.update(playerRef, player.getData());
            return player;
        });

        return this.#returnPlayerResponce(player, playerId);
    }

    async moveObjectFromBagToInventory(playerId, objectId) {

        const responceObject = await this.#datasource.runTransaction(async (transaction) => {
            
            const playerSnap = await this.#findPlayerT(transaction, playerId);
            const player = new Player(playerSnap.data());

            const objectData = player.dropObjectFromBag(objectId);
            if (!objectData) {
                throw new Error(ChatRPGErrors.objectNotInBag);
            }
            
            this.#addObjectToPlayerInventoryT(player, objectData.content, objectData.type, transaction);
            transaction.set(playerSnap.ref, player.getData());

            return {...player.getData(), id: playerSnap.ref.id};
        });

        return responceObject;
    }

    async moveObjectFromInventoryToBag(playerId, pageId, objectId) {
        const responceObject = await this.#datasource.runTransaction(async (transaction) => {

            const playerSnap = await this.#findPlayerT(transaction, playerId);
            const player = new Player(playerSnap.data());

            if (!player.getInventoryPageLog(pageId)) {
                throw new Error(ChatRPGErrors.inventoryPageNotFound);
            }

            const pageRef = this.#datasource.collection(Schema.Collections.InventoryPages).doc(pageId);
            const pageSnap = await transaction.get(pageRef);

            if(!pageSnap.exists) {
                throw new Error(ChatRPGErrors.inventoryPageNotFound);
            }

            const page = new InventoryPage(pageSnap.data());
            const droppedObject = page.dropObjectFromInventory(objectId);

            if(!droppedObject) {
                throw new Error(ChatRPGErrors.objectNotInInventory)
            }

            const addedObject = player.addObjectToBag(droppedObject.content, droppedObject.type);

            if(!addedObject) {
                throw new Error(ChatRPGErrors.bagFull);
            }

            player.onObjectRemovedFromInventory(page);
            transaction.set(pageRef, page.getData());
            transaction.set(playerSnap.ref, player.getData);

            return {
                player: {...player.getData(), id: playerSnap.ref.id},
                page: {...page.getData(), id: pageRef.id}
            };
        });

        return responceObject;
    }

    async dropObjectFromInventory(playerId, pageId, objectId) {
        const responceObject = await this.#datasource.runTransaction(async (transaction) => {
            const playerSnap = await this.#findPlayerT(transaction, playerId);
            const player = new Player(playerSnap.data());

            if (!player.getInventoryPageLog(pageId)) {
                throw new Error(ChatRPGErrors.inventoryPageNotFound);
            }

            const pageRef = this.#datasource.collection(Schema.Collections.InventoryPages).doc(pageId);
            const pageSnap = await transaction.get(pageRef);

            if(!pageSnap.exists) {
                throw new Error(ChatRPGErrors.inventoryPageNotFound);
            }

            const page = new InventoryPage(pageSnap.data());
            const droppedObject = page.dropObjectFromInventory(objectId);

            if(!droppedObject) {
                throw new Error(ChatRPGErrors.objectNotInInventory)
            }

            player.onObjectRemovedFromInventory(page);
            transaction.set(pageRef, page.getData());
            transaction.set(playerSnap.ref, player.getData);

            return {
                player: {...player.getData(), id: playerSnap.ref.id},
                page: {...page.getData(), id: pageRef.id}
            };
        });

        return responceObject;
    }

    async claimObject(playerId, objectId) {
        const responceObject = await this.#datasource.runTransaction(async (transaction) => {
            const playerSnap = await this.#findPlayerT(transaction, playerId);
            const player = new Player(playerSnap.data());

            const claimedObject = player.removeLastDrop(objectId);

            if(!claimedObject) {
                throw new Error(ChatRPGErrors.objectCantBeclaimed);
            }

            this.#addObjectToPlayerInventoryT(player, claimedObject.content, claimedObject.type, transaction);

            return this.#returnPlayerResponce(player, playerSnap.ref.id);
        });

        return responceObject;
    }

    async getInventoryPage(playerId, pageId) {
        const playerSnap = await this.#findPlayer(playerId);
        const player = new Player(playerSnap.data());

        if (!player.getInventoryPageLog(pageId)) {
            throw new Error(ChatRPGErrors.inventoryPageNotFound);
        }

        const pageRef = this.#datasource.collection(Schema.Collections.InventoryPages).doc(pageId);
        const pageSnap = await pageRef.get();

        if(!pageSnap.exists) {
            throw new Error(ChatRPGErrors.inventoryPageNotFound);
        }

        const page = new InventoryPage(pageSnap.data());

        return {...page.getData(), pageId};
    }

    #returnPlayerResponce(player, id) {
        return {...player.getData(), id};
    }
    async #findPlayer(id) {
        const playerSnapShot = await this.#datasource.collection(Schema.Collections.Accounts).doc(id).get();
        
        if(!playerSnapShot.exists) {
            throw new Error(ChatRPGErrors.playerNotFound);
        }

        return playerSnapShot;
    }

    // T mean transaction
    async #findPlayerT(transaction, playerId) {
        const playerRef = this.#datasource.collection(Schema.Collections.Accounts).doc(playerId);
        const playerSnap = await transaction.get(playerRef);

        if(!playerSnap.exists) {
            throw new Error(ChatRPGErrors.playerNotFound);
        }

        return playerSnap;
    }

    async #findShop(shopId) {
        const shopSnapshot = await this.#datasource.collection(Schema.Collections.Shops).doc(shopId).get();
        if(!shopSnapshot.exists) {
            throw new Error(ChatRPGErrors.shopNotFound);
        }

        return shopSnapshot;
    }

    async #findGame(id) {
        const gameSnapshot = await this.#datasource.collection(Schema.Collections.Games).doc(id).get();

        if(!gameSnapshot.exists) {
            throw new Error(ChatRPGErrors.gameNotFound);
        }

        return gameSnapshot;
    }

    async #findPlayerbyPlatformId(platformId, platform) {
        const idProperty = this.#getPlatformIdProperty(platform);
        
        const playerQuerySnapShot = await this.#datasource.collection(Schema.Collections.Accounts).where(idProperty, '==', platformId).get();
        
        if(playerQuerySnapShot.empty) {
            throw new Error(ChatRPGErrors.playerNotFound);
        }

        return playerQuerySnapShot.docs[0];
    }

    #getPlatformIdProperty(platform) {
        switch (platform) {
            case ChatRPG.Platforms.Twitch:
                return Schema.AccountFields.TwitchId;
        default:
            return '';
        }
    }

    async #addObjectToPlayerInventoryT(player, object, type, transaction) {
        let pageId = player.getNextAvailableInventoryPageId();
        const pageRef = this.#datasource.collection(Schema.Collections.InventoryPages).doc(pageId);
        const page = new InventoryPage();
        page.addObjectToInventory(object, type);
        if (!pageId) {
            pageId = pageRef.id;
            transaction.set(pageRef, page.getData());
        }
        else {
            transaction.update(pageRef, {objects: FieldValue.arrayUnion(page.datastoreObject.objects[0])});
        }

        player.onObjectAddedToInventory(pageId);
    }
}

module.exports = ChatRPG;