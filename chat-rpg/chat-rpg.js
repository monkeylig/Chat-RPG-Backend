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

class ChatRPG {
    #datasource;
    
    static Platforms = {
        Twitch: 'twitch'
    }

    static Errors = {
        playerExists: 'player exists',
        playerNotFound: 'player not found',
        gameNotFound: 'game not found',
        monsterInstanceNotFound: 'monster instance not found',
        playerNotInGame: 'Player not in game',
        battleNotFound: 'Battle not found',
        weaponNotInBag: 'Weapon not in bag',
        bookNotInBag: 'Book not in bag',
        badAbilityBookIndex: 'Ability book index out of range',
        abilityNotFound: 'Ability not found',
        itemNotinBag: 'Item not in bag',
        abilitiesFull: 'Player ability slots are full',
        abilityRequirementNotMet: 'The requirements to equip this ability were not met',
        abilityNotEquipped: 'This ability is not equipped',
        itemNotEquipped: 'This item is not equipped',
        notEnoughAp: 'Not enough ap to use this ability'
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
            throw new Error(ChatRPG.Errors.playerExists);
        }

        const player = new Player({name, avatar});

        player.setData(platformIdProperty, platformId);

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
        const playerData = player.getUnflattenedData();
        playerData.id = playerSnap.ref.id;

        return playerData;
    }

    async joinGame(playerId, gameId) {
        //Make sure the user exists
        const playerSnap = await this.#findPlayer(playerId);
        const player = new Player(playerSnap.data());

        const gameRef = this.#datasource.collection(Schema.Collections.Games).doc(gameId);
    
        const game = await this.#datasource.runTransaction(async (transaction) => {
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
            throw new Error(ChatRPG.Errors.playerNotInGame);
        }

        let targetMonsterData = game.findMonsterById(monsterId, false);
        if(!targetMonsterData) {
            if(fallbackMonster) {
                const monsterRef = await this.#datasource.collection('monsters').doc(fallbackMonster.class).get();
                const monsterClass = new MonsterClass(monsterRef.data());
                targetMonsterData = monsterClass.createMonsterInstance(fallbackMonster.level).datastoreObject;
                targetMonsterData.id = monsterId;
            }
            else {
                throw new Error(ChatRPG.Errors.monsterInstanceNotFound);
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
            environment: {}
        };

        const battleRef = this.#datasource.collection(Schema.Collections.Battles).doc();
        await battleRef.set(battle);

        battle.id = battleRef.id;

        return battle;
    }

    async battleAction(battleId, actionRequest) {
        const battleSnap = await this.#datasource.collection(Schema.Collections.Battles).doc(battleId).get();

        if(!battleSnap.exists) {
            throw new Error(ChatRPG.Errors.battleNotFound);
        }

        const battle = battleSnap.data();
        const battlePlayer = new BattlePlayer(battle.player);
        const battlePlayerData = battlePlayer.datastoreObject;
        const monster = new BattleMonster(battle.monster);
        const monsterData = monster.datastoreObject;
        
        const monsterActionRequest = monsterAi.genericAi(battle);

        //Proccess battle actions
        //player action
        const playerAction = this.#createBattleAction(actionRequest, battlePlayer);
        //monster action
        const monsterAction = this.#createBattleAction(monsterActionRequest, monster);

        const steps = [];

        if(playerAction.speed >= monsterAction.speed) {
            steps.push(...this.#executeActionPhase(battlePlayer, playerAction, monster, monsterAction, battle));
        }
        else if(playerAction.speed < monsterAction.speed) {
            steps.push(...this.#executeActionPhase(monster, monsterAction, battlePlayer, playerAction, battle));
        }

        const result = {};
        const playerRef = this.#datasource.collection(Schema.Collections.Accounts).doc(battlePlayerData.id);
        const player = new Player((await playerRef.get()).data());

        if(playerAction.type === 'escape') {
            result.winner = null;
            result.endCondition = 'escape';
            steps.push({
                type: "battle_end",
                description: `${battlePlayerData.name} escaped.`
            });

            await this.#finishBattle(battleSnap.ref, playerRef, player, battlePlayer);
            return {player: battlePlayerData, monster: monsterData, steps, result};
        }

        if(battlePlayer.isDefeated() || monster.isDefeated()) {

            if(battlePlayer.isDefeated() && monster.isDefeated()) {
                result.winner = null;
                steps.push({
                    type: "battle_end",
                    description: "The battle ended in a draw."
                });
            }
            else if(battlePlayer.isDefeated()) {
                player.onPlayerDefeated();
                result.winner = monsterData.id;
                steps.push(BattleSteps.battleEnd(`${battlePlayerData.name} was defeated.`));
            }
            else if(monster.isDefeated()) {
                const expGain = monster.getExpGain();
                const oldLevel = battlePlayerData.level;
                battlePlayer.addExpAndLevel(expGain);


                result.winner = battlePlayerData.id;
                result.expAward = expGain;
                result.drops = [];
                const lastDrop = {
                    weapons: []
                };

                // Compute the monster drops
                const willDropWeapon = chatRPGUtility.random() < monsterData.weaponDropRate && !player.hasWeapon(monsterData.weapon);

                if(willDropWeapon) {
                    const drop = {
                        type: 'weapon',
                        content: monsterData.weapon,
                        bagFull: false
                    };

                    if(!player.addWeapon(monsterData.weapon)) {
                        drop.bagFull = true;
                        lastDrop.weapons.push(monsterData.weapon);
                    }
                    result.drops.push(drop);
                }

                if(monsterData.coinDrop > 0) {
                    const drop = {
                        type: 'coin',
                        content: {
                            name: `${monsterData.coinDrop} coins`,
                            icon: 'coin.png'
                        }
                    };
                    player.addCoins(monsterData.coinDrop);
                    result.drops.push(drop);
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
                }

                steps.push({
                    type: "battle_end",
                    description: `${monsterData.name} was defeated!`
                });
            }

            await this.#finishBattle(battleSnap.ref, playerRef, player, battlePlayer);
            return {player: battlePlayerData, monster: monsterData, steps, result};
        }

        battle.player = battlePlayerData;
        battle.monster = monsterData;
        await battleSnap.ref.set(battle);

        return {player: battlePlayerData, monster: monsterData, steps};
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
            throw new ChatRPG.Errors.weaponNotInBag;
        }

        await playSnap.ref.update({weapon: weaponData});

        player.equipWeapon(weaponData);
        return player.getUnflattenedData();
    }

    async dropWeapon(playerId, weaponId) {

        let player;
        const playerRef = this.#datasource.collection(Schema.Collections.Accounts).doc(playerId);
        await this.#datasource.runTransaction(async (transaction) => {
            const playerSnap = await transaction.get(playerRef);

            if(!playerSnap.exists) {
                throw new ChatRPG.Errors.playerNotFound;
            }

            player = new Player(playerSnap.data());

            const weaponData = player.findWeaponById(weaponId);
            if(!weaponData) {
                throw new ChatRPG.Errors.weaponNotInBag;
            }

            transaction.update(playerRef, {'bag.weapons': FieldValue.arrayRemove(weaponData)});

            if(player.isWeaponEquipped(weaponId)) {
                transaction.update(playerRef, {weapon: chatRPGUtility.defaultWeapon});
            }

        });

        player.dropWeapon(weaponId);
        return player.getUnflattenedData();
    }

    async equipAbility(playerId, abilityBookName, abilityIndex, replacedAbilityName) {

        const playerSnap = await this.#findPlayer(playerId);
        const playerData = playerSnap.data();
        const player = new Player(playerData);
        const book = player.findBookByName(abilityBookName, false);

        if(!book) {
            throw new Error(ChatRPG.Errors.bookNotInBag);
        }

        if(abilityIndex >= book.abilities.length || abilityIndex < 0) {
            throw new Error(ChatRPG.Errors.badAbilityBookIndex);
        }

        if(!player.abilityRequirementMet(book, abilityIndex)) {
            throw new Error(ChatRPG.Errors.abilityRequirementNotMet);
        }

        const abilityBookEntry = book.abilities[abilityIndex];

        let replacedAbility;

        if(replacedAbilityName) {
            replacedAbility = player.findAbilityByName(replacedAbilityName);

            if(!replacedAbility) {
                throw new Error(ChatRPG.Errors.abilityNotFound);
            }
        }
        else if(!player.hasOpenAbilitySlot()) {
            throw new Error(ChatRPG.Errors.abilitiesFull);
        }

        await this.#datasource.runTransaction(async (transaction) => {

            if(replacedAbility) {
                transaction.update(playerSnap.ref, {'abilities': FieldValue.arrayRemove(replacedAbility)});
            }
            transaction.update(playerSnap.ref, {'abilities': FieldValue.arrayUnion(abilityBookEntry.ability)});
        });

        player.equipAbility(abilityBookEntry.ability, replacedAbilityName);
        return player.getUnflattenedData();
    }

    async dropBook(playerId, abilityBookName) {
        const playerSnap = await this.#findPlayer(playerId);
        const player = new Player(playerSnap.data());
        const book = player.findBookByName(abilityBookName);

        if(!book) {
            throw new ChatRPG.Errors.bookNotInBag;
        }

        await playerSnap.ref.update({'bag.books': FieldValue.arrayRemove(book)});

        player.dropBook(abilityBookName);
        return player.getUnflattenedData();
    }

    async dropItem(playerId, itemName) {
        const playerSnap = await this.#findPlayer(playerId);
        const player = new Player(playerSnap.data());
        const item = player.findItemByName(itemName);

        if(!item) {
            throw new ChatRPG.Errors.itemNotinBag;
        }

        await playerSnap.ref.update({'bag.items': FieldValue.arrayRemove(item)});

        player.dropItem(itemName);
        return player.getUnflattenedData();
    }

    #executeActionPhase(firstPlayer, firstAction, secondPlayer, secondAction, battle) {
        const steps = [];
        steps.push(...this.#applyAction(firstAction, firstPlayer, secondPlayer, battle));
        if(firstPlayer.isDefeated() || secondPlayer.isDefeated()) {
            return steps;    
        }

        steps.push(...this.#applyAction(secondAction, secondPlayer, firstPlayer, battle));

        return steps;
    }

    #applyAction(battleAction, srcPlayer, targetPlayer, battle) {
        const steps = [];
        const srcPlayerData = srcPlayer.datastoreObject;
        const targetPlayerData = targetPlayer.datastoreObject;
        // Damage step
        if(battleAction.type === 'strike') {
            
            if(srcPlayer.strikeAbilityReady()) {
                srcPlayer.getData().strikeLevel = 0;
                const strikeAbility = new Ability(srcPlayer.getData().weapon.strikeAbility);
                const abilitySteps = this.#createAbilitySteps(strikeAbility, srcPlayer, targetPlayer, battle);
                steps.push(...abilitySteps);
                srcPlayer.onStrikeAbility();
            }
            else {
                const infoStep = BattleSteps.info(`${srcPlayer.getData().name} strikes ${targetPlayer.getData().name}!`, 'strike', srcPlayer.getData().id, chatRPGUtility.strikeAnim);
                const damageStep = BattleSteps.damage(srcPlayer, targetPlayer, srcPlayer.getData().weapon.baseDamage + srcPlayer.getEmpowermentValue('strike'));
                steps.push(infoStep);
                steps.push(damageStep);
                srcPlayer.onStrike();
            }

        }

        else if(battleAction.type === 'ability') {
            steps.push(...this.#createAbilitySteps(battleAction.ability, srcPlayer, targetPlayer, battle));
            srcPlayer.onAbilityUsed(battleAction.ability);
        }

        else if(battleAction.type === 'item') {
            const itemData = battleAction.item.datastoreObject;
            const infoStep = BattleSteps.info(`${srcPlayerData.name} used ${itemData.name}!`, 'item', srcPlayerData.id);
            const standardSteps = ItemFunctions.standardBattleSteps(itemData, srcPlayerData, targetPlayerData);
            const itemSteps = ItemFunctions.effectBattleSteps(itemData, battle, srcPlayerData, targetPlayerData, {});
            srcPlayer.onItemUsed(battleAction.item);

            steps.push(infoStep);
            if(standardSteps) {
                steps.push(...standardSteps);
            }
            if(itemSteps) {
                steps.push(...itemSteps);
            }
        }

        return steps;
    }

    #createAbilitySteps(ability, srcPlayer, targetPlayer, battle) {
        const steps = [];
        const infoStep = BattleSteps.info(`${srcPlayer.getData().name} used ${ability.getData().name}!`, 'ability', srcPlayer.getData().id, ability.getData().animation);
        const standardSteps = AbilityFunctions.standardSteps(ability, battle, srcPlayer, targetPlayer);
        const abilitySteps = AbilityFunctions.effectSteps(ability, battle, srcPlayer, targetPlayer, {});

        steps.push(infoStep);
        if(standardSteps) {
            steps.push(...standardSteps);
        }
        if(abilitySteps) {
            steps.push(...abilitySteps);
        }
        return steps;
    }

    #createBattleAction(actionRequest, battlePlayer) {
        const playerData = battlePlayer.datastoreObject;
        let playerBattleAction;
        if(actionRequest.type === 'strike') {
            const weapon = new BattleWeapon(playerData.weapon);
            playerBattleAction = {
                type: 'strike',
                speed: weapon.getModifiedSpeed()
            }
        }
        else if(actionRequest.type === 'escape') {
            playerBattleAction = {
                type: 'escape',
            }
        }

        else if(actionRequest.type === 'ability') {
            const abilityData = battlePlayer.findAbilityByName(actionRequest.abilityName);
            if(!abilityData) {
                throw new Error(ChatRPG.Errors.abilityNotEquipped);
            }
            const ability = new Ability(abilityData);

            if(playerData.ap < ability.getData().apCost) {
                throw new Error(ChatRPG.Errors.notEnoughAp);
            }

            playerBattleAction = {
                type: 'ability',
                ability: ability,
                speed: ability.getData().speed
            }
        }

        else if(actionRequest.type === 'item') {
            const itemData = battlePlayer.findItemByName(actionRequest.itemName);
            if(!itemData) {
                throw new Error(ChatRPG.Errors.itemNotEquipped);
            }
            const item = new Item(itemData);

            playerBattleAction = {
                type: 'item',
                item: item,
                speed: 10000
            }

        }

        return playerBattleAction;
    }

    async #findPlayer(id) {
        const playerSnapShot = await this.#datasource.collection(Schema.Collections.Accounts).doc(id).get();
        
        if(!playerSnapShot.exists) {
            throw new Error(ChatRPG.Errors.playerNotFound);
        }

        return playerSnapShot;
    }

    async #findGame(id) {
        const gameSnapshot = await this.#datasource.collection(Schema.Collections.Games).doc(id).get();

        if(!gameSnapshot.exists) {
            throw new Error(ChatRPG.Errors.gameNotFound);
        }

        return gameSnapshot;
    }

    async #findPlayerbyPlatformId(platformId, platform) {
        const idProperty = this.#getPlatformIdProperty(platform);
        
        const playerQuerySnapShot = await this.#datasource.collection(Schema.Collections.Accounts).where(idProperty, '==', platformId).get();
        
        if(playerQuerySnapShot.empty) {
            throw new Error(ChatRPG.Errors.playerNotFound);
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