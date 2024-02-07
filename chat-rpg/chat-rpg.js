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
const { Book } = require("./datastore-objects/book");
const gameplayObjects = require("./gameplay-objects");

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

    async getGameInfo() {
        const gameInfoSnap = await this.#datasource.collection(Schema.Collections.Configs).doc('gameInfo').get();
        const gameInfo = gameInfoSnap.data();

        if(gameInfo) {
            return gameInfo;
        }

        return {};
    }

    async addNewPlayer(name, avatar, weaponType, vitalityBonus, platformId, platform) {

        const platformIdProperty = this.#getPlatformIdProperty(platform);

        const playersRef = this.#datasource.collection(Schema.Collections.Accounts);
        const querySnap = await playersRef.where(platformIdProperty, '==', platformId).get();

        if(!querySnap.empty) {
            throw new Error(ChatRPGErrors.playerExists);
        }

        const player = new Player({name, avatar, [platformIdProperty]: platformId});

        if(weaponType) {
            player.getData().weapon = gameplayObjects.startingWeapons[weaponType];    
        }

        if(vitalityBonus === 'health') {
            player.getData().maxHealth += 2;
            player.getData().health += 2;
        }
        else if(vitalityBonus === 'defense') {
            player.getData().defense += 1;
        }

        player.addItemToBag(gameplayObjects.startingItems.items.potion);
        player.addItemToBag(gameplayObjects.startingItems.items.phoenixDown);
        player.addBookToBag(gameplayObjects.startingItems.books.warriorMasteryI);
        player.addBookToBag(gameplayObjects.startingItems.books.wizardMasteryI);

        const playerRef = playersRef.doc();
        await playerRef.set(player.getData());

        return this.#returnPlayerResponce(player, playerRef.id);
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
                    const game = await GameModes.auto.createGame(this.#datasource);
                    game.onPlayerJoin(player);
                    transaction.create(gameRef, game.getData());
                    return game;
                }

                const game = new Game(transGameSnap.data());
                game.onPlayerJoin(player);
                await GameModes[game.getData().mode].onPlayerJoin(this.#datasource, game, player);
                transaction.update(gameRef, {trackers: game.getData().trackers})
                return game;
            });
        } catch (error) {
            console.error(error);
        }

        await playerSnap.ref.update({ currentGameId: gameId });
        player.datastoreObject.currentGameId = gameId;

        await GameModes[game.getData().mode].postProcessGameState(this.#datasource, game, player);
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

                player.onMonsterDefeated();
                
                try {
                    await this.#datasource.runTransaction(async (transaction) => {

                        const transGameSnap = await this.#findGameT(transaction, battle.gameId);
                        
                        const game = new Game(transGameSnap.data());
                        game.onPlayerLevelUp(oldLevel, player);
                        const transMonster = game.findMonsterById(monsterData.id);
                        if(!transMonster || !game.removeMonster(monsterData.id)) {
                            return;
                        }

                        await GameModes[game.getData().mode].onMonsterDefeated(this.#datasource, game, battlePlayer, monster);
                        transaction.update(transGameSnap.ref, {trackers: game.getData().trackers, monsters: game.getMonsters()});
                    });
                } catch(error) {
                    console.error(error);
                }
            }

            await this.#finishBattle(battleSnap.ref, playerRef, player, battlePlayer);

            const updatedPlayer = player.getData();
            updatedPlayer.id = battlePlayerData.id;
            return {
                ...battle,
                updatedPlayer,
                player: battlePlayerData,
                monster: monsterData,
                steps, 
                result: battle.result};
        }

        await battleSnap.ref.set(battle);

        return {
            ...battle,
            turn: battle.round - 1,
            steps};
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

    async equipAbility(playerId, abilityBookId, abilityIndex, replacedAbilityName) {

        const playerSnap = await this.#findPlayer(playerId);
        const playerData = playerSnap.data();
        const player = new Player(playerData);
        const bookObject = player.findObjectInBag(abilityBookId, false);

        if(!bookObject) {
            throw new Error(ChatRPGErrors.bookNotInBag);
        }

        const book = new Book(bookObject.content);

        if(abilityIndex >= book.getData().abilities.length || abilityIndex < 0) {
            throw new Error(ChatRPGErrors.badAbilityBookIndex);
        }

        if(!book.isAbilityRequirementsMet(abilityIndex)) {
            throw new Error(ChatRPGErrors.abilityRequirementNotMet);
        }

        const abilityBookEntry = book.getData().abilities[abilityIndex];

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

    async buy(playerId, shopId, productId, amount) {
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
            let purchacedObject;
            switch(shopItem.getData().type) {
                case 'weapon':
                    purchacedObject = new Weapon(shopItem.getData().product);
                    break;
                case 'book':
                    purchacedObject = new Book(shopItem.getData().product);
                    break;
                case 'item':
                    purchacedObject = new Item({...shopItem.getData().product, count: amount});
                    break;
                default:
                    throw new Error(ChatRPGErrors.unrecognizedItemType);
            }

            if(player.getData().bag.objects.length >= player.getData().bag.capacity) {
                this.#addObjectToPlayerInventoryT(player, purchacedObject.getData(), shopItem.getData().type, transaction);
            }
            else {
                player.addObjectToBag(purchacedObject.getData(), shopItem.getData().type);
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

            player.onObjectRemovedFromInventory(pageId);
            transaction.set(pageRef, page.getData());
            transaction.set(playerSnap.ref, player.getData());

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
            transaction.set(playerSnap.ref, player.getData());

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

            if(!player.addObjectToBag(claimedObject.content, claimedObject.type)) {
                this.#addObjectToPlayerInventoryT(player, claimedObject.content, claimedObject.type, transaction);
            }

            transaction.set(playerSnap.ref, player.getData());

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

        return {...page.getData(), id: pageId};
    }

    async productPurchase(playerId, productSku) {
        const productSnap = await this.#datasource.collection(Schema.Collections.Products).doc(productSku).get();

        if (!productSnap.exists) {
            throw new Error(ChatRPGErrors.productSkuNotFound);
        }

        const productData = productSnap.data();

        const playerData = await this.#datasource.runTransaction(async (transaction) =>{
            const playerSnap = await this.#findPlayerT(transaction, playerId);
            const player = new Player(playerSnap.data());

            switch(productSku) {
                case 'Tier1CoinPackage':
                case 'Tier2CoinPackage':
                case 'Tier3CoinPackage':
                case 'Tier4CoinPackage':
                    player.getData().coins += productData.coins;
                    break;
            }

            transaction.set(playerSnap.ref, player.getData());
            return this.#returnPlayerResponce(player, playerId);
        });

        return playerData;
    }

    async updateGame(gameId, mode) {
        const game = await GameModes[mode].createGame(this.#datasource);

        const gameRef = this.#datasource.collection(Schema.Collections.Games).doc(gameId);
        await gameRef.set(game.getData());

        return game.getData();
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

    // T means transaction
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

    async #findGameT(transaction, id) {
        const gameRef = this.#datasource.collection(Schema.Collections.Games).doc(id);
        const gameSnapshot = await transaction.get(gameRef);

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

    // WARNING: This function reads first then writes. Remember not to do a transaction write before calling this function 
    async #addObjectToPlayerInventoryT(player, object, type, transaction) {
        let pageId = player.getNextAvailableInventoryPageId();
        const pageRef = this.#datasource.collection(Schema.Collections.InventoryPages).doc(pageId);
        if (!pageId) {
            const page = new InventoryPage();
            page.addObjectToInventory(object, type);
            pageId = pageRef.id;
            transaction.set(pageRef, page.getData());
            player.onObjectAddedToInventory(pageId);
        }
        else {
            const pageData = (await transaction.get(pageRef)).data();
            const page = new InventoryPage(pageData);
            page.addObjectToInventory(object, type);
            transaction.update(pageRef, page.getData());
            const oldSize = pageData.objects.length;
            const newSize = page.getData().objects.length;
            if(oldSize != newSize) {
                player.onObjectAddedToInventory(pageId);
            }
        }
    }

    async #finishBattle(battleRef, playerRef, player, battlePlayer) {
        player.mergeBattlePlayer(battlePlayer);
        await playerRef.set(player.getData());
        await battleRef.delete();
    }
}

module.exports = ChatRPG;