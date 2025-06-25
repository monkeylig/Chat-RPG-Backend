/**
 * @import {PlayerData} from "./datastore-objects/agent"
 * @import {GConstructor} from "./utility"
 * @import {IBackendDataSourceTransaction} from "../data-source/backend-data-source"
 * @import {BattleStep} from "./battle-system/battle-steps"
 * @import {TransactionFunction} from "../data-source/backend-data-source"
 * @import {InventoryPageData} from "./datastore-objects/inventory-page"
 * @import {ConsumeItemStep} from "./battle-system/battle-steps"
 * @import {BookData} from "./datastore-objects/book"
 * @import {ItemData} from "./datastore-objects/item"
 * @import {WeaponData} from "./datastore-objects/weapon"
 * @import {CollectionContainer} from "./datastore-objects/utilities"
 * @import {PlayerActionRequest} from "./battle-system/battle-system"
 */

const {FieldValue, IBackendDataSource} = require("../data-source/backend-data-source");
const {Schema} = require("./datasource-schema");
const GameModes = require("./game-modes");
const chatRPGUtility = require('./utility');
const {Player} = require('./datastore-objects/agent');
const Game = require('./datastore-objects/game');
const { BattlePlayer, BattleMonster } = require("./datastore-objects/battle-agent");
const Item = require('./datastore-objects/item');
const {MonsterClass} = require("./datastore-objects/monster-class");
const {Weapon} = require("./datastore-objects/weapon");
const { Shop, ShopItem } = require("./datastore-objects/shop");
const ChatRPGErrors = require('./errors');
const { InventoryPage } = require("./datastore-objects/inventory-page");
const { Book } = require("./datastore-objects/book");
const gameplayObjects = require("./gameplay-objects");
const { BattleSystem } = require("./battle-system/battle-system");
const { Battle } = require("./datastore-objects/battle");
const { BattleContext } = require("./battle-system/battle-context");
const DatastoreObject = require("./datastore-objects/datastore-object");
const { ItemBattleMove } = require("./battle-system/item-battle-move");
const BattleSteps = require("./battle-system/battle-steps");
const { GameCollection } = require("./datastore-objects/utilities");
const { RPGDatabaseProcessor } = require("./rpg-database-processor");

const PLAYER_STARTING_COINS = 2000;
const WEAPONS_IN_SHOP_ROTATION = 20;
const WeaponPriceByStar = {
    1: 25,
    2: 150,
    3: 500
};

/**
 * @typedef {'bag'|'inventory'} StorageLocation
 * @typedef {PlayerData & {id: string}} UserPlayerData
 * @typedef {InventoryPageData & {id: string}} UserInventoryPageData
 */

/**
 * The main backend class
 */
class ChatRPG {
    
    #dataSource;
    
    static Platforms = {
        Twitch: 'twitch'
    }

    /**
     * Initialize an instance of the Web RPG Game
     * @param {IBackendDataSource} dataSource 
     */
    constructor(dataSource) {
        this.#dataSource = dataSource;
        this.#dataSource.addProcessor(new RPGDatabaseProcessor());
    }

    /**
     * 
     * @param {string} id 
     * @returns 
     */
    async resetAccount(id) {
        const playerSnap = await this.#findPlayer(id);

        await playerSnap.ref.delete();
        return {message: "OK"};
    }

    async getStartingAvatars() {
        const avatars = await this.#dataSource.collection(Schema.Collections.Avatars).doc(Schema.AvatarDocuments.StartingAvatars).get();
        const avatarData = avatars.data();

        if (avatarData) {
            return avatarData[Schema.AvatarFields.Content];
        }
        
        return [];
    }

    async getGameInfo() {
        const gameInfoSnap = await this.#dataSource.collection(Schema.Collections.Configs).doc('gameInfo').get();
        const gameInfo = gameInfoSnap.data();

        if(gameInfo) {
            return gameInfo;
        }

        return {};
    }

    async addNewPlayer(name, avatar, weaponType, vitalityBonus, platformId, platform) {

        const platformIdProperty = this.#getPlatformIdProperty(platform);

        const playersRef = this.#dataSource.collection(Schema.Collections.Accounts);
        const querySnap = await playersRef.where(platformIdProperty, '==', platformId).get();

        if(!querySnap.empty) {
            throw new Error(ChatRPGErrors.playerExists);
        }

        const player = new Player({name, avatar, [platformIdProperty]: platformId});

        player.addCoins(PLAYER_STARTING_COINS);
        if(weaponType) {
            player.getData().weapon = gameplayObjects.startingWeapons[weaponType];    
        }

        if(vitalityBonus === 'health') {
            player.getData().maxHealth += 2;
            player.getData().health += 2;
        }
        else if(vitalityBonus === 'defense') {
            player.getData().defense += 2;
        }

        player.addItemToBag(gameplayObjects.startingItems.items.potion);
        player.addItemToBag(gameplayObjects.startingItems.items.phoenixDown);
        player.addBookToBag(gameplayObjects.startingItems.books.warriorMasteryI);
        player.addBookToBag(gameplayObjects.startingItems.books.wizardMasteryI);

        player.addAbility(gameplayObjects.startingItems.books.warriorMasteryI.abilities[0].ability);
        player.addAbility(gameplayObjects.startingItems.books.wizardMasteryI.abilities[0].ability);

        if (name === "Twitch Reviewer 8634") {
            /**@type {(book: BookData) => BookData} */
            const unlockBook = (book) => {
                for(const ability of book.abilities) {
                    for(const req of ability.requirements) {
                        req.count = req.requiredCount;
                    }
                }
                return book;
            }
            player.setStatsAtLevel(1000);
            player.addCoins(100000000);

            let book = new Book(gameplayObjects.content.books.fireBlade).getData();
            player.addBookToBag(unlockBook(book));
            book = new Book(gameplayObjects.content.books.fireMagic).getData();
            player.addBookToBag(unlockBook(book));
            book = new Book(gameplayObjects.content.books.lightningBlade).getData();
            player.addBookToBag(unlockBook(book));
            book = new Book(gameplayObjects.content.books.lightningMagic).getData();
            player.addBookToBag(unlockBook(book));
            book = new Book(gameplayObjects.content.books.waterBlade).getData();
            player.addBookToBag(unlockBook(book));
            book = new Book(gameplayObjects.content.books.waterMagic).getData();
            player.addBookToBag(unlockBook(book));
        }

        const playerRef = playersRef.doc();
        await playerRef.set(player.getData());

        return this.#returnPlayerResponce(player, playerRef.id);
    }

    /**
     * 
     * @param {string} id 
     * @param {string} [platform] 
     * @returns {Promise<UserPlayerData>}
     */
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

        const gameRef = this.#dataSource.collection(Schema.Collections.Games).doc(gameId);
    
        let game;
        try {
            game = await this.#dataSource.runTransaction(async (transaction) => {
                const transGameSnap = await transaction.get(gameRef);
                if(!transGameSnap.exists) {
                    //TODO Use the host's game mode from the config
                    const game = await GameModes.auto.createGame(this.#dataSource);
                    game.onPlayerJoin(player);
                    transaction.create(gameRef, game.getData());
                    return game;
                }

                const game = new Game(transGameSnap.data());
                game.onPlayerJoin(player);
                await GameModes[game.getData().mode].onPlayerJoin(this.#dataSource, game, player);
                transaction.update(gameRef, {trackers: game.getData().trackers})
                return game;
            });
        } catch (error) {
            console.error(error);
        }

        await playerSnap.ref.update({ currentGameId: gameId });
        player.datastoreObject.currentGameId = gameId;

        await GameModes[game.getData().mode].postProcessGameState(this.#dataSource, game, player);
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
                const monsterRef = await this.#dataSource.collection('monsters').doc(fallbackMonster.monsterClass).get();
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

        const battleRef = this.#dataSource.collection(Schema.Collections.Battles).doc();
        const battle = new Battle({
            player: battlePlayer.getData(),
            monster: battleMonster.getData(),
            gameId: gameSnap.ref.id,
            strikeAnim: chatRPGUtility.strikeAnim,
            environment: {},
            round: 1,
            active: true
        });

        const battleContext = new BattleContext(battle.getData(), true);

        await battleRef.set(battleContext.battle);
        return {
            ...battleContext.battle,
            id: battleRef.id
        };
    }

    /**
     * Initiate an action in a battle
     * @param {string} battleId 
     * @param {PlayerActionRequest} actionRequest 
     * @returns 
     */
    async battleAction(battleId, actionRequest) {
        const battleSnap = await this.#dataSource.collection(Schema.Collections.Battles).doc(battleId).get();

        if(!battleSnap.exists) {
            throw new Error(ChatRPGErrors.battleNotFound);
        }

        const battleSystem = new BattleSystem(battleSnap.data());
        const steps = battleSystem.singlePlayerBattleIteration(actionRequest);
        const battle = battleSystem.battleContext.battle;

        const battlePlayer = new BattlePlayer(battle.player);
        const battlePlayerData = battlePlayer.getData();
        const monster = new BattleMonster(battle.monster);
        const monsterData = monster.getData();

        if(!battle.active) {
            const playerRef = this.#dataSource.collection(Schema.Collections.Accounts).doc(battlePlayerData.id);
            const player = new Player((await playerRef.get()).data());
           if(battlePlayer.isDefeated()) {
                player.onPlayerDefeated();
            }
            else if(monster.isDefeated()) {
                const oldLevel = battlePlayer.getData().level;

                player.onMonsterDefeated();
                
                try {
                    await this.#dataSource.runTransaction(async (transaction) => {

                        const transGameSnap = await this.#findGameT(transaction, battle.gameId);
                        
                        const game = new Game(transGameSnap.data());
                        game.onPlayerLevelUp(oldLevel, player);
                        const transMonster = game.findMonsterById(monsterData.id);
                        if(!transMonster || !game.removeMonster(monsterData.id)) {
                            return;
                        }

                        await GameModes[game.getData().mode].onMonsterDefeated(this.#dataSource, game, battlePlayer, monster);
                        transaction.update(transGameSnap.ref, {trackers: game.getData().trackers, monsters: game.getMonsters()});
                    });
                } catch(error) {
                    console.error(error);
                }
            }

            await this.#finishBattle(battleSnap.ref, playerRef, player, battlePlayer);

            /**@type {PlayerData & {id: string}} */
            const updatedPlayer = {
                ...player.getData(),
                id: battlePlayerData.id
            };
            return {
                ...battle,
                updatedPlayer,
                player: battlePlayerData,
                monster: monsterData,
                steps, 
                result: battle.result};
        }

        await battleSnap.ref.update(battle);

        return {
            ...battle,
            turn: battle.round - 1,
            steps};
    }

    /**
     * 
     * @param {string} playerId 
     * @param {string} weaponId 
     * @returns {Promise<UserPlayerData>}
     */
    async equipWeapon(playerId, weaponId) {
        const playerRef = this.#dataSource.collection(Schema.Collections.Accounts).doc(playerId);
        const player = await this.#dataSource.runTransaction(async (transaction) => {
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
        const player = await this.#dataSource.runTransaction(async (transaction) => {
            const playerRef = this.#dataSource.collection(Schema.Collections.Accounts).doc(playerId);
            const playerSnap = await transaction.get(playerRef);

            if(!playerSnap.exists) {
                throw new Error(ChatRPGErrors.playerNotFound);
            }

            const playerT = new Player(playerSnap.data());

            const bagObject = playerT.findObjectInBag(objectId);
            if(!bagObject) {
                throw new Error(ChatRPGErrors.objectNotInBag);
            }

            transaction.update(playerRef, {'bag.objects': FieldValue.arrayRemove(bagObject)});

            return playerT;
        });

        while (player.dropObjectFromBag(objectId)) {}
        return this.#returnPlayerResponce(player, playerId);
    }

    async equipAbility(playerId, abilityBookId, abilityIndex, replacedAbilityName) {

        const playerSnap = await this.#findPlayer(playerId);
        const playerData = playerSnap.data();
        const player = new Player(playerData);
        const bookObject = player.findObjectInBag(abilityBookId);

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

        await this.#dataSource.runTransaction(async (transaction) => {

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
        return {...shopData, id: shopId};
    }

    /**
     * 
     * @param {string} playerId 
     * @param {string} shopId 
     * @param {string} productId 
     * @param {number} amount 
     * @returns {Promise<UserPlayerData>}
     */
    async buy(playerId, shopId, productId, amount=1) {
        amount = Math.floor(amount);
        const shopSnapshot = await this.#findShop(shopId);

        const shop = new Shop(shopSnapshot.data());
        const shopItem = shop.findProduct(productId);

        if(!shopItem) {
            throw new Error(ChatRPGErrors.productNotFound);
        }

        const playerRef = this.#dataSource.collection(Schema.Collections.Accounts).doc(playerId);
        const player = await this.#dataSource.runTransaction(async (transaction) => {
            const playerSnap = await transaction.get(playerRef);

            if(!playerSnap.exists) {
                throw new Error(ChatRPGErrors.playerNotFound);
            }

            const player = new Player(playerSnap.data());

            if(player.getData().coins < shopItem.getData().price * amount) {
                throw new Error(ChatRPGErrors.insufficientFunds);
            }

            player.getData().coins -= shopItem.getData().price * amount;
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

            if(!player.addObjectToBag(purchacedObject.getData(), shopItem.getData().type)) {
                await this.#addObjectToPlayerInventoryT(player, purchacedObject.getData(), shopItem.getData().type, transaction);
            }

            transaction.update(playerRef, player.getData());
            return player;
        });

        return this.#returnPlayerResponce(player, playerId);
    }

    /**
     * 
     * @param {string} playerId 
     * @param {string} objectId 
     * @returns {Promise<{
     *     player: UserPlayerData,
     *     page: UserInventoryPageData
     * }>}
     */
    async moveObjectFromBagToInventory(playerId, objectId) {

        const responseObject = await this.#dataSource.runTransaction(async (transaction) => {

            const playerSnap = await this.#findPlayerT(transaction, playerId);
            const player = new Player(playerSnap.data());

            const objectData = player.dropObjectFromBag(objectId);
            if (!objectData) {
                throw new Error(ChatRPGErrors.objectNotInBag);
            }
            
            const pageData = await this.#addObjectToPlayerInventoryT(player, objectData.content, objectData.type, transaction);
            transaction.update(playerSnap.ref, player.getData());

            return {
                player: {...player.getData(), id: playerSnap.ref.id},
                page: pageData
            };
        });

        return responseObject;
    }

    /**
     * 
     * @param {string} playerId 
     * @param {string} pageId 
     * @param {string} objectId 
     * @returns {Promise<{
     *     player: UserPlayerData,
     *     page: UserInventoryPageData,
     *     objectInBag: CollectionContainer
     * }>}
     */
    async moveObjectFromInventoryToBag(playerId, pageId, objectId) {
        const responseObject = await this.#dataSource.runTransaction(async (transaction) => {

            const playerSnap = await this.#findPlayerT(transaction, playerId);
            const player = new Player(playerSnap.data());

            if (!player.getInventoryPageLog(pageId)) {
                throw new Error(ChatRPGErrors.inventoryPageNotFound);
            }

            const pageRef = this.#dataSource.collection(Schema.Collections.InventoryPages).doc(pageId);
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
            transaction.update(playerSnap.ref, player.getData());

            return {
                player: {...player.getData(), id: playerSnap.ref.id},
                page: {...page.getData(), id: pageRef.id},
                objectInBag: addedObject
            };
        });

        return responseObject;
    }

    async dropObjectFromInventory(playerId, pageId, objectId) {
        const responceObject = await this.#dataSource.runTransaction(async (transaction) => {
            const playerSnap = await this.#findPlayerT(transaction, playerId);
            const player = new Player(playerSnap.data());

            if (!player.getInventoryPageLog(pageId)) {
                throw new Error(ChatRPGErrors.inventoryPageNotFound);
            }

            const pageRef = this.#dataSource.collection(Schema.Collections.InventoryPages).doc(pageId);
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
            transaction.update(playerSnap.ref, player.getData());

            return {
                player: {...player.getData(), id: playerSnap.ref.id},
                page: {...page.getData(), id: pageRef.id}
            };
        });

        return responceObject;
    }

    async claimObject(playerId, objectId) {
        const responceObject = await this.#dataSource.runTransaction(async (transaction) => {
            const playerSnap = await this.#findPlayerT(transaction, playerId);
            const player = new Player(playerSnap.data());

            const claimedObject = player.removeLastDrop(objectId);

            if(!claimedObject) {
                throw new Error(ChatRPGErrors.objectCantBeclaimed);
            }

            if(!player.addObjectToBag(claimedObject.content, claimedObject.type)) {
                await this.#addObjectToPlayerInventoryT(player, claimedObject.content, claimedObject.type, transaction);
            }

            transaction.update(playerSnap.ref, player.getData());

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

        const pageRef = this.#dataSource.collection(Schema.Collections.InventoryPages).doc(pageId);
        const pageSnap = await pageRef.get();

        if(!pageSnap.exists) {
            throw new Error(ChatRPGErrors.inventoryPageNotFound);
        }

        const page = new InventoryPage(pageSnap.data());

        return {...page.getData(), id: pageId};
    }

    async productPurchase(playerId, productSku) {
        const productSnap = await this.#dataSource.collection(Schema.Collections.Products).doc(productSku).get();

        if (!productSnap.exists) {
            throw new Error(ChatRPGErrors.productSkuNotFound);
        }

        const productData = productSnap.data();

        const playerData = await this.#dataSource.runTransaction(async (transaction) =>{
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

            transaction.update(playerSnap.ref, player.getData());
            return this.#returnPlayerResponce(player, playerId);
        });

        return playerData;
    }

    async updateGame(gameId, mode) {
        const game = await GameModes[mode].createGame(this.#dataSource);

        const gameRef = this.#dataSource.collection(Schema.Collections.Games).doc(gameId);
        await gameRef.set(game.getData());

        return game.getData();
    }   
    /**
     * Use an Item outside of battle. By default, the item will be used from the bag.
     * Use the options parameter to use an item from an inventory page instead.
     * @param {string} playerId
     * @param {string} objectId 
     * @param {{
     * itemLocation?: {type: string, source: {pageId?: string}}
     * }} [options]
     * @returns {Promise<{
     * player: UserPlayerData,
     * inventoryPage?: InventoryPageData & {id: string},
     * usedItem: ItemData,
     * steps: BattleStep[]
     * }>}
     */
    async useItem(playerId, objectId, options) {
        return await this.#runTransaction(async(transaction) => {
            if (options && options.itemLocation) {
                if (options.itemLocation.type === 'inventory') {
                    const locationSource = options.itemLocation.source;
                    if (locationSource.pageId) {
                        return this.useItemFromInventory(playerId, objectId, locationSource.pageId, transaction);
                    }
                }
            }

            return await this.useItemFromBag(playerId, objectId, transaction);
        });
    }

    /**
     * Use an Item outside of battle from the player's bag.
     * @param {string} playerId
     * @param {string} objectId
     * @param {IBackendDataSourceTransaction} transaction 
     * @returns {Promise<{
     * player: UserPlayerData,
     * usedItem: ItemData,
     * steps: BattleStep[]
     * }>}
     */
    async useItemFromBag(playerId, objectId, transaction) {
        return this.#withObjectTransaction(Player, (player) => {
            const bagItem = player.findObjectInBag(objectId);
            if (!bagItem || bagItem.type !== 'item') {
                throw new Error(ChatRPGErrors.itemNotinBag);
            }

            const item = new Item(bagItem.content);
            const result = this.#useItemOutOfBattle(player, item);

            return {
                player: {...player.getData(), id: playerId},
                usedItem: item.getData(),
                steps: result.steps};
        }, transaction, Schema.Collections.Accounts, playerId, ChatRPGErrors.playerNotFound);
    }

    /**
     * Use item outside of battle from inventory page.
     * @param {string} playerId 
     * @param {string} objectId 
     * @param {string} pageId
     * @param {IBackendDataSourceTransaction} transaction 
     * @returns {Promise<{
     * player: UserPlayerData,
     * inventoryPage: InventoryPageData & {id: string}
     * usedItem: ItemData,
     * steps: BattleStep[]
     * }>}
     */
    async useItemFromInventory(playerId, objectId, pageId, transaction) {
        return this.#withObjectTransaction(Player, (player) => {
            return this.#withObjectTransaction(InventoryPage, (page) => {
                const inventoryItem = page.findObjectById(objectId);
                if (!inventoryItem || inventoryItem.type !== 'item') {
                    throw new Error(ChatRPGErrors.objectNotInInventory);
                }

                const item = new Item(inventoryItem.content);
                const result = this.#useItemOutOfBattle(player, item, 'inventory');

                inventoryItem.content = item.getData();
                if (item.isDepleted()) {
                    const droppedItem = page.dropObjectFromInventory(objectId);
                    if (droppedItem) {
                        player.onObjectRemovedFromInventory(pageId);
                    }
                }       

                return {
                    player: {...result.player, id: playerId},
                    inventoryPage: {...page.getData(), id: pageId},
                    usedItem: item.getData(),
                    steps: result.steps};
            }, transaction, Schema.Collections.InventoryPages, pageId, ChatRPGErrors.inventoryPageNotFound);
        }, transaction, Schema.Collections.Accounts, playerId, ChatRPGErrors.playerNotFound);
    }

    
    /**
     * @typedef {Object} SellOptions
     * @property {{
     *     inventory?: {
     *         pageId: string
     *     }
     * }} [itemLocation]
     * @property {number} [count]
     */
    /**
     * Sell an object. By default, the object will be sold from the bag.
     * Use the options parameter to sell from an inventory page instead.
     * @param {string} playerId - The player selling the object
     * @param {string} objectId - The object to be sold
     * @param {string} shopId - The shop to be sold from
     * @param {SellOptions} [options] - Options to change the selling location
     * @returns {Promise<{
     *     player: UserPlayerData,
     *     soldObject: Object
     *     inventoryPage?: UserInventoryPageData
     * }>}
     */
    async sell(playerId, objectId, shopId, options) {
        const shopSnapshot = await this.#findShop(shopId);

        if (!options) {
            options = {};
        }

        //Sanitize data from the datastore
        const shop = new Shop(shopSnapshot.data());
        let count = 1;
        if (options.count != undefined) {
            if (options.count < 1) {
                throw new Error(ChatRPGErrors.invalidParams);
            }
            count = Math.floor(options.count);
        }

        return this.#runTransaction((transaction) => {
            if (options.itemLocation && options.itemLocation.inventory) {
                const pageId = options.itemLocation.inventory.pageId;
                return this.sellFromInventory(playerId, pageId, objectId, shop, count, transaction);
            }
            
            return this.sellFromBag(playerId, objectId, shop, count, transaction);
        });
    }

    /**
     * 
     * @param {string} playerId 
     * @param {string} objectId 
     * @param {Shop} shop 
     * @param {number} count
     * @param {IBackendDataSourceTransaction} transaction
     * @returns {Promise<{
     * player: UserPlayerData,
     * soldObject: Object
     * }>}
     */
    sellFromBag(playerId, objectId, shop, count, transaction) {
        return this.#withPlayerTransaction((player) => {

            const soldObject = this.sellObject(player, objectId, player.getBag(), shop, count);

            return {
                player: {...player.getData(), id: playerId},
                soldObject: soldObject
            };
        }, transaction, playerId);
    }

    /**
     * 
     * @param {string} playerId 
     * @param {string} pageId 
     * @param {string} objectId 
     * @param {Shop} shop 
     * @param {number} count
     * @param {IBackendDataSourceTransaction} transaction 
     * @returns {Promise<{
     * player: UserPlayerData,
     * inventoryPage: UserInventoryPageData,
     * soldObject: Object
     * }>}
     */
    sellFromInventory(playerId, pageId, objectId, shop, count, transaction) {
        return this.#withInventoryTransaction((player, page) => {

            const soldObject = this.sellObject(player, objectId, page.getPage(), shop, count);

            return {
                player: {...player.getData(), id: playerId},
                inventoryPage: {...page.getData(), id: pageId},
                soldObject: soldObject
            }
        }, transaction, playerId, pageId);
    }

    /**
     * 
     * @param {Player} player 
     * @param {string} objectId 
     * @param {GameCollection} gameCollection 
     * @param {Shop} shop 
     * @param {number} count - The number of copies in the stack to sell
     * @returns {Object}
     */
    sellObject(player, objectId, gameCollection, shop, count) {
        const objectContainer = gameCollection.findObjectById(objectId);
        if (!objectContainer) {
            throw new Error(ChatRPGErrors.objectNotFound);
        }

        let sellLimit = 1;
        if (objectContainer.content.count && objectContainer.content.count > 0) {
            sellLimit = objectContainer.content.count;
        }

        if (count > sellLimit) {
            throw new Error(ChatRPGErrors.insufficientObjectStackSize);
        }

        const resellValue = shop.lookUpResellValue(objectContainer.content);

        gameCollection.dropObject(objectId, {count: count});
        player.addCoins(resellValue * count);

        return objectContainer.content;
    }

    async refreshDailyShop() {
        const shopSnapshot = await this.#findShop('daily');
        const shop = new Shop(shopSnapshot.data());

        //Filter out all weapons because these will be rotated
        shop.getData().products = shop.getData().products.filter((shopItem) => {
            return shopItem.type !== 'weapon';
        });

        const weaponsRef = this.#dataSource.collection('weapons');
        const weaponCount = (await weaponsRef.count().get()).data().count;
        const weaponsNumbersForSale = [];
        const weaponRequests = [];
        for (let i = 0; i < weaponCount; i++) {
            weaponsNumbersForSale.push(i);
        }

        for(let i = 0; i < Math.min(weaponCount, WEAPONS_IN_SHOP_ROTATION); i++) {
            const index = Math.floor(Math.random() * weaponsNumbersForSale.length);
            const instanceNumber = weaponsNumbersForSale[index];
            weaponRequests.push(weaponsRef.where("instanceNumber", "==", instanceNumber).get());
            weaponsNumbersForSale.splice(index, 1);
        }

        const weaponSnapshots = await Promise.all(weaponRequests);
        const weapons = [];

        for(const weaponSnap of weaponSnapshots) {
            if (weaponSnap.empty) {
                continue;
            }
            const weapon = new Weapon(weaponSnap.docs[0].data());
            weapons.push(weapon);
        }
        
        weapons.sort((a, b) => {return a.getData().stars - b.getData().stars});

        for(const weapon of weapons) {
            const price = WeaponPriceByStar[weapon.getData().stars];
            shop.addShopItem(new ShopItem({price, type: 'weapon', product: weapon.getData()}));
        }

        shop.getData().products.sort((left, right) => {
            const order = {
                'weapon': 1,
                'book': 2,
                'item': 3,
            };

            return order[left.type] - order[right.type];

        })

        await shopSnapshot.ref.set(shop.getData());
    }

    /**
     * 
     * @returns {Promise<{
     *    activePlayersCount: number,
     *    created: any
     * }>}
     */
    async createDailyReport() {
        const DailyReportInterval = 24 * 1000 * 60 * 60; // 24 hours in milliseconds
        const playersRef = this.#dataSource.collection(Schema.Collections.Accounts);
        const cutoffDate = Date.now() - DailyReportInterval;
        const dailyReport = {
            created: FieldValue.Timestamp,
            activePlayersCount: 0,
        };

        // Log the number of active players.
        const activePlayersQuery = playersRef.where("lastAction", ">", this.#dataSource.timestamp(cutoffDate));
        const activePlayersCountSnap = await activePlayersQuery.count().get();
        const activePlayersCount = activePlayersCountSnap.data().count;
        dailyReport.activePlayersCount = activePlayersCount;

        const dailyReportsRef = this.#dataSource.collection(Schema.Collections.DailyReports);
        await dailyReportsRef.add(dailyReport);

        return dailyReport;
    }

    /**
     * 
     * @param {Player} player 
     * @param {Item} item 
     * @param {StorageLocation} location 
     * @returns {{player: PlayerData, usedItem?: ItemData, steps: BattleStep[]}}
     */
    #useItemOutOfBattle(player, item, location='bag') {
        if (!item.getData().outOfBattle) {
            const infoStep = BattleSteps.info("Can't use this item out of battle.");
            return {player: {...player.getData()}, steps: [infoStep]};
        }
        const battleContext = new BattleContext(new Battle({player: player.getData()}).getData());

        battleContext.activateBattleMove(new ItemBattleMove(battleContext.player, item, location));
        const steps = battleContext.resolve();

        player.mergeBattlePlayer(battleContext.player);

        return {player: {...player.getData()}, usedItem: item.getData(), steps}
    }

    /**
     * 
     * @param {TransactionFunction} transactionFunction 
     */
    #runTransaction(transactionFunction) {
        return this.#dataSource.runTransaction(transactionFunction);
    }

    /**
     * @template {DatastoreObject} TDatastoreType
     * 
     * @param {GConstructor<TDatastoreType>} objectConstructor 
     * @param {(dataObject: TDatastoreType) => void} logicFunc 
     * @param {IBackendDataSourceTransaction} transaction 
     * @param {string} collection 
     * @param {string} documentId 
     * @param {string} [notFoundError] 
     * @param {any[]} [extraConstructorArgs]
     * @returns {Promise<any>}
     */
    async #withObjectTransaction(objectConstructor, logicFunc, transaction, collection, documentId, notFoundError = ChatRPGErrors.objectNotFound, extraConstructorArgs=[]) {
        const documentRef = this.#dataSource.collection(collection).doc(documentId);
        const documentSnap = await transaction.get(documentRef);

        if (!documentSnap.exists) {
            throw new Error(notFoundError);
        }

        const dataObject = new objectConstructor(documentSnap.data(), ...extraConstructorArgs);
        const returnData = await Promise.resolve(logicFunc(dataObject));

        transaction.update(documentRef, dataObject.getData());

        return returnData;
    }

    /**
     * 
     * @param {(player: Player) => void} logicFunc 
     * @param {IBackendDataSourceTransaction} transaction 
     * @param {string} playerId 
     * @returns {Promise<any>}
     */
    #withPlayerTransaction(logicFunc, transaction, playerId) {
        return this.#withObjectTransaction(Player, async (player) => {

            const returnData = await Promise.resolve(logicFunc(player));                
            return returnData;

        }, transaction, Schema.Collections.Accounts, playerId, ChatRPGErrors.playerNotFound);
    }

    /**
     * 
     * @param {(player: Player, page: InventoryPage) => void} logicFunc 
     * @param {IBackendDataSourceTransaction} transaction 
     * @param {string} playerId 
     * @param {string} pageId 
     * @returns {Promise<any>}
     */
    async #withInventoryTransaction(logicFunc, transaction, playerId, pageId) {
        return this.#withObjectTransaction(Player, (player) => {
            return this.#withObjectTransaction(InventoryPage, async (page) => {

                const returnData = await Promise.resolve(logicFunc(player, page));                
                return returnData;

            }, transaction, Schema.Collections.InventoryPages, pageId, ChatRPGErrors.inventoryPageNotFound, [pageId, player]);
        }, transaction, Schema.Collections.Accounts, playerId, ChatRPGErrors.playerNotFound);
    }

    /**
     * 
     * @param {Player} player 
     * @param {string} id 
     * @returns {UserPlayerData}
     */
    #returnPlayerResponce(player, id) {
        return {...player.getData(), id};
    }

    async #findPlayer(id) {
        const playerSnapShot = await this.#dataSource.collection(Schema.Collections.Accounts).doc(id).get();
        
        if(!playerSnapShot.exists) {
            throw new Error(ChatRPGErrors.playerNotFound);
        }

        return playerSnapShot;
    }

    // T means transaction
    async #findPlayerT(transaction, playerId) {
        const playerRef = this.#dataSource.collection(Schema.Collections.Accounts).doc(playerId);
        const playerSnap = await transaction.get(playerRef);

        if(!playerSnap.exists) {
            throw new Error(ChatRPGErrors.playerNotFound);
        }

        return playerSnap;
    }

    async #findShop(shopId) {
        const shopSnapshot = await this.#dataSource.collection(Schema.Collections.Shops).doc(shopId).get();
        if(!shopSnapshot.exists) {
            throw new Error(ChatRPGErrors.shopNotFound);
        }

        return shopSnapshot;
    }

    async #findGame(id) {
        const gameSnapshot = await this.#dataSource.collection(Schema.Collections.Games).doc(id).get();

        if(!gameSnapshot.exists) {
            throw new Error(ChatRPGErrors.gameNotFound);
        }

        return gameSnapshot;
    }

    async #findGameT(transaction, id) {
        const gameRef = this.#dataSource.collection(Schema.Collections.Games).doc(id);
        const gameSnapshot = await transaction.get(gameRef);

        if(!gameSnapshot.exists) {
            throw new Error(ChatRPGErrors.gameNotFound);
        }

        return gameSnapshot;
    }

    async #findPlayerbyPlatformId(platformId, platform) {
        const idProperty = this.#getPlatformIdProperty(platform);
        
        const playerQuerySnapShot = await this.#dataSource.collection(Schema.Collections.Accounts).where(idProperty, '==', platformId).get();
        
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
        const pageRef = this.#dataSource.collection(Schema.Collections.InventoryPages).doc(pageId);
        if (!pageId) {
            const page = new InventoryPage();
            page.addObjectToInventory(object, type);
            pageId = pageRef.id;
            player.onObjectAddedToInventory(pageId);
            transaction.set(pageRef, page.getData());
            return {...page.getData(), id: pageRef.id};
        }
        else {
            const pageSnap = await transaction.get(pageRef)
            if(!pageSnap.exists) {
                console.log("missing object")
            }
            const pageData = pageSnap.data();
            const page = new InventoryPage(pageData);
            page.addObjectToInventory(object, type);
            transaction.update(pageRef, page.getData());
            const oldSize = pageData.objects.length;
            const newSize = page.getData().objects.length;
            if(oldSize != newSize) {
                player.onObjectAddedToInventory(pageId);
            }

            return {...page.getData(), id: pageRef.id};
        }
    }

    async #finishBattle(battleRef, playerRef, player, battlePlayer) {
        player.mergeBattlePlayer(battlePlayer);
        await playerRef.update(player.getData());
        await battleRef.delete();
    }
}

module.exports = {ChatRPG};