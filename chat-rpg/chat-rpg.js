const {FieldValue} = require("../data-source/backend-data-source");
const Schema = require("./datasource-schema");
const GameModes = require("./game-modes");
const monsterAi = require("./monster-ai/monster-ai");
const chatRPGUtility = require('./utility');
const {Player} = require('./datastore-objects/agent');
const Game = require('./datastore-objects/game');
const { BattlePlayer, BattleMonster } = require("./datastore-objects/battle-agent");
const BattleSteps = require('./battle-steps');
const AbilityFunctions = require('./ability-functions/ability-functions');

const BATTLE_AP = 3;
const STRIKE_ABILITY_TRIGGER = 3;

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
        abilitiesFull: 'Player ability slots are full'
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

        const player = new Player({name, avatar});

        const platformIdProperty = this.#getPlatformIdProperty(platform);
        player.setData(platformIdProperty, platformId);

        const playersRef = this.#datasource.collection(Schema.Collections.Accounts);
        const querySnap = await playersRef.where(platformIdProperty, '==', platformId).get();

        if(!querySnap.empty) {
            throw new Error(ChatRPG.Errors.playerExists);
        }

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
        const player = await this.#findPlayer(playerId);

        const gameRef = this.#datasource.collection(Schema.Collections.Games).doc(gameId);
        const gameSnap = await gameRef.get();
        let game;
        if(!gameSnap.exists) {
            //TODO Use the host's game mode from the config
            game = await GameModes.arena.createGame(this.#datasource)

            const gameData = await this.#datasource.runTransaction(async (transaction) => {
                const transGameSnap = await transaction.get(gameRef);
                if(!transGameSnap.exists) {
                    const transGameData = game.getData();
                    transaction.create(gameRef, transGameData);
                    return transGameData;
               }
               return transGameSnap.data();
           });
           game = new Game(gameData);
        }
        else {
            game = new Game(gameSnap.data());
        }

        await player.ref.update({ currentGameId: gameId });

        game.setData('id', gameRef.id);
        return game.getUnflattenedData();
    }

    async getGame(gameId) {
        const game = new Game((await this.#findGame(gameId)).data());
        game.setData('id', gameId);
        return game.getUnflattenedData();
    }

    async startBattle(playerId, gameId, monsterId) {
        const playerSnap = await this.#findPlayer(playerId);
        const gameSnap = await this.#findGame(gameId);
        const game = new Game(gameSnap.data());

        const playerData = playerSnap.data();
        if(playerData.currentGameId != gameSnap.ref.id) {
            throw new Error(ChatRPG.Errors.playerNotInGame);
        }

        const targetMonster = game.findMonsterById(monsterId, false);
        if(!targetMonster) {
            throw new Error(ChatRPG.Errors.monsterInstanceNotFound);
        }

        playerData.id = playerSnap.ref.id;
        const battlePlayer = new BattlePlayer(playerData);
        targetMonster.id = monsterId;
        const battleMonster = new BattleMonster(targetMonster);

        const battle = {
            player: battlePlayer.getData(),
            monster: battleMonster.getData(),
            gameId: gameSnap.ref.id,
            strikeAnim: chatRPGUtility.strikeAnim
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
        const playerAction = this.#createBattleAction(actionRequest, battlePlayerData);
        //monster action
        const monsterAction = this.#createBattleAction(monsterActionRequest, monsterData);

        const steps = [];

        if(playerAction.speed >= monsterAction.speed) {
            steps.push(...this.#executeActionPhase(battlePlayerData, playerAction, monsterData, monsterAction));
        }
        else if(playerAction.speed < monsterAction.speed) {
            steps.push(...this.#executeActionPhase(monsterData, monsterAction, battlePlayerData, playerAction));
        }

        const result = {};
        const playerRef = this.#datasource.collection(Schema.Collections.Accounts).doc(battlePlayerData.id);
        const player = new Player((await playerRef.get()).data());

        if(playerAction.name === 'escape') {
            result.winner = null;
            steps.push({
                type: "battle_end",
                description: `${battlePlayerData.name} escaped.`
            });

            player.mergeBattlePlayer(battlePlayer);
            await playerRef.set(player.getData());

            return await this.#updateAndReturnBattleStatus(battleSnap.ref, {player: battlePlayerData, monster: monsterData, steps, result}, true);
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
                result.winner = monsterData.id;
                steps.push({
                    type: "battle_end",
                    description: `${battlePlayerData.name} was defeated.`
                });
            }
            else if(monster.isDefeated()) {
                const expGain = monster.getExpGain();
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
                
                if(lastDrop.weapons.length) {
                    player.setLastDrop(lastDrop);
                }

                player.mergeBattlePlayer(battlePlayer);
                await playerRef.set(player.getData());
                
                // Remove the monster from the game
                const gameSnap = await this.#findGame(battle.gameId);
                const game = new Game(gameSnap.data());
                
                // Skip transaction if it is unnessesary
                if(game.findMonsterById(monsterData.id, false)) {
                    await this.#datasource.runTransaction(async (transaction) => {
                        const transGameSnap = await transaction.get(gameSnap.ref);
                        const transGame = new Game(transGameSnap.data());
                        
                        const transMonster = transGame.findMonsterById(monsterData.id);
                        if(!transMonster) {
                            return;
                        }
                        
                        transaction.update(transGameSnap.ref, {monsters: FieldValue.arrayRemove(transMonster)});
                    });
                }

                steps.push({
                    type: "battle_end",
                    description: `${monsterData.name} was defeated!`
                });
            }

            return await this.#updateAndReturnBattleStatus(battleSnap.ref, {player: battlePlayerData, monster: monsterData, steps, result}, true);
        }

        return await this.#updateAndReturnBattleStatus(battleSnap.ref, {player: battlePlayerData, monster: monsterData, steps});
    }

    async equipWeapon(playerId, weaponId) {

        const playSnap = await this.#findPlayer(playerId);
        const player = new Player(playSnap.data());

        const weaponData = player.findWeaponById(weaponId, false);

        if(!weaponData) {
            throw ChatRPG.Errors.weaponNotInBag;
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
                throw ChatRPG.Errors.playerNotFound;
            }

            player = new Player(playerSnap.data());

            const weaponData = player.findWeaponById(weaponId);
            if(!weaponData) {
                throw ChatRPG.Errors.weaponNotInBag;
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

        let player;
        let ability;

        await this.#datasource.runTransaction(async (transaction) => {
            const playerSnap = await this.#findPlayer(playerId);
            const playerData = playerSnap.data();
            player = new Player(playerData);
            const book = player.findBookByName(abilityBookName, false);

            if(!book) {
                throw ChatRPG.Errors.bookNotInBag;
            }

            if(abilityIndex >= book.abilities.length || abilityIndex < 0) {
                throw ChatRPG.Errors.badAbilityBookIndex;
            }

            ability = book.abilities[abilityIndex];

            let flatAbility;

            if(replacedAbilityName) {
                flatAbility = player.findAbilityByName(replacedAbilityName);

                if(!flatAbility) {
                    throw ChatRPG.Errors.abilityNotFound;
                }
            }
            else if(!player.hasOpenAbilitySlot()) {
                throw ChatRPG.Errors.abilitiesFull;
            }

            if(flatAbility) {
                transaction.update(playerSnap.ref, {'abilities': FieldValue.arrayRemove(flatAbility)});
            }
            transaction.update(playerSnap.ref, {'abilities': FieldValue.arrayUnion(JSON.stringify(ability))});
        });

        player.equipAbility(ability, replacedAbilityName);
        return player.getUnflattenedData();
    }

    async dropBook(playerId, abilityBookName) {
        const playerSnap = await this.#findPlayer(playerId);
        const player = new Player(playerSnap.data());
        const book = player.findBookByName(abilityBookName);

        if(!book) {
            throw ChatRPG.Errors.bookNotInBag;
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
            throw ChatRPG.Errors.itemNotinBag;
        }

        await playerSnap.ref.update({'bag.items': FieldValue.arrayRemove(item)});

        player.dropItem(itemName);
        return player.getUnflattenedData();
    }

    async #updateAndReturnBattleStatus(battleRef, battle, deleteBattle=false) {
        if(!deleteBattle) {
            await battleRef.update({
                player: battle.player,
                monster: battle.monster
            });
        }
        else {
            await battleRef.delete();
        }

        return battle;
    }

    #executeActionPhase(firstPlayer, firstAction, secondPlayer, secondAction) {
        const steps = [];
        steps.push(...this.#applyAction(firstAction, firstPlayer, secondPlayer));
        if(this.#isDefeated(firstPlayer) || this.#isDefeated(secondPlayer)) {
            return steps;    
        }

        steps.push(...this.#applyAction(secondAction, secondPlayer, firstPlayer));

        return steps;
    }

    #isDefeated(player) {
        return player.health <= 0;
    }

    #applyAction(battleAction, srcPlayer, targetPlayer) {
        const steps = [];
        // Damage step
        if(battleAction.name == 'strike') {
            srcPlayer.strikeLevel += 1;
            
            if(srcPlayer.strikeLevel == STRIKE_ABILITY_TRIGGER) {
                srcPlayer.strikeLevel = 0;
                const infoStep = BattleSteps.info(`${srcPlayer.name} used ${srcPlayer.weapon.strikeAbility.name}!`);
                const standardSteps = AbilityFunctions.standardSteps(srcPlayer.weapon.strikeAbility, srcPlayer, targetPlayer);
                steps.push(infoStep);
                steps.push(...standardSteps);
            }
            else {
                const infoStep = BattleSteps.info(`${srcPlayer.name} strikes ${targetPlayer.name}!`);
                infoStep.action = 'strike';
                infoStep.actorId = srcPlayer.id;
                const damageStep = BattleSteps.damage(srcPlayer, targetPlayer, srcPlayer.weapon.baseDamage);
                steps.push(infoStep);
                steps.push(damageStep);
            }
        }

        return steps;
    }

    #createBattleAction(actionRequest, player) {
        let playerBattleAction;
        if(actionRequest.type == 'strike') {
            playerBattleAction = {
                name: 'strike',
                speed: player.weapon.speed,
                damage: player.weapon.baseDamage
            }
        }
        else if(actionRequest.type === 'escape') {
            playerBattleAction = {
                name: 'escape',
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