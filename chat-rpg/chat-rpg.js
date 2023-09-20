const {FieldValue} = require("../data-source/backend-data-source");
const Schema = require("./datasource-schema");
const GameModes = require("./game-modes");
const monsterAi = require("./monster-ai/monster-ai");
const chatRPGUtility = require('./utility');
const {Player} = require('./datastore-objects/agent');
const Game = require('./datastore-objects/game');
const { BattlePlayer, BattleMonster } = require("./datastore-objects/battle-agent");
const Ability = require('./datastore-objects/ability');
const Item = require('./datastore-objects/item');
const {MonsterClass} = require("./datastore-objects/monster-class");
const BattleSteps = require('./battle-steps');
const AbilityFunctions = require('./equippable-functions/ability-functions');
const ItemFunctions = require('./equippable-functions/item-functions');
const {BattleWeapon} = require("./datastore-objects/weapon");
const { Shop, ShopItem } = require("./datastore-objects/shop");
const BattleFunctions = require('./battle/battle')
const ChatRPGErrors = require('./errors')

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

        player.addItem(chatRPGUtility.startingItems.items.potion);
        player.addItem(chatRPGUtility.startingItems.items.phoenixDown);
        player.addBook(chatRPGUtility.startingItems.books.warriorMasteryI);
        player.addBook(chatRPGUtility.startingItems.books.wizardMasteryI);

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
                            if(!player.addWeapon(monsterData.weapon)) {
                                drop.bagFull = true;
                                lastDrop.weapons.push(monsterData.weapon);
                            }
                            break;
                        case 'coin':
                            player.addCoins(monsterData.coinDrop);
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

        const playSnap = await this.#findPlayer(playerId);
        const player = new Player(playSnap.data());

        const weaponData = player.findWeaponById(weaponId, false);

        if(!weaponData) {
            throw new ChatRPGErrors.weaponNotInBag;
        }

        await playSnap.ref.update({weapon: weaponData});

        player.equipWeapon(weaponData);
        return this.#returnPlayerResponce(player, playerId);
    }

    async dropWeapon(playerId, weaponId) {

        let player;
        const playerRef = this.#datasource.collection(Schema.Collections.Accounts).doc(playerId);
        await this.#datasource.runTransaction(async (transaction) => {
            const playerSnap = await transaction.get(playerRef);

            if(!playerSnap.exists) {
                throw new ChatRPGErrors.playerNotFound;
            }

            player = new Player(playerSnap.data());

            const weaponData = player.findWeaponById(weaponId);
            if(!weaponData) {
                throw new ChatRPGErrors.weaponNotInBag;
            }

            transaction.update(playerRef, {'bag.weapons': FieldValue.arrayRemove(weaponData)});

            if(player.isWeaponEquipped(weaponId)) {
                transaction.update(playerRef, {weapon: chatRPGUtility.defaultWeapon});
            }

        });

        player.dropWeapon(weaponId);
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

    async dropBook(playerId, abilityBookName) {
        const playerSnap = await this.#findPlayer(playerId);
        const player = new Player(playerSnap.data());
        const book = player.findBookByName(abilityBookName);

        if(!book) {
            throw new ChatRPGErrors.bookNotInBag;
        }

        await playerSnap.ref.update({'bag.books': FieldValue.arrayRemove(book)});

        player.dropBook(abilityBookName);
        const playerData = player.getData();
        playerData.id = playerId;
        return playerData;
    }

    async dropItem(playerId, itemName) {
        const playerSnap = await this.#findPlayer(playerId);
        const player = new Player(playerSnap.data());
        const item = player.findItemByName(itemName);

        if(!item) {
            throw new ChatRPGErrors.itemNotinBag;
        }

        await playerSnap.ref.update({'bag.items': FieldValue.arrayRemove(item)});

        player.dropItem(itemName);
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


            switch(shopItem.getData().type) {
                case 'weapon':
                    if(player.getData().bag.weapons.length >= player.getData().bag.capacity) {
                        player.getData().bag.capacity = player.getData().bag.weapons.length + 1;
                    }

                    player.addWeapon(shopItem.getData().product);
                    break;
                case 'item':
                    if(player.getData().bag.items.length >= player.getData().bag.capacity) {
                        player.getData().bag.capacity = player.getData().bag.items.length + 1;
                    }

                    player.addItem(new Item(shopItem.getData().product));
                    break;
            }

            transaction.update(playerRef, player.getData());
            return player;
        });

        return this.#returnPlayerResponce(player, playerId);
    }

    #returnPlayerResponce(player, id) {
        const playerData = player.getData();
        playerData.id = id;
        return playerData;
    }
    async #findPlayer(id) {
        const playerSnapShot = await this.#datasource.collection(Schema.Collections.Accounts).doc(id).get();
        
        if(!playerSnapShot.exists) {
            throw new Error(ChatRPGErrors.playerNotFound);
        }

        return playerSnapShot;
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
}

module.exports = ChatRPG;