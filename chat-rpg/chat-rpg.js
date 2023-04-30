const {IBackendDataSource, FieldValue} = require("../data-source/backend-data-source");
const Schema = require("./datasource-schema");
const GameModes = require("./game-modes");
const monsterAi = require("./monster-ai/monster-ai");
const chatRPGUtility = require('./utility');
const {Player} = require('./datastore-objects/agent');
const Game = require('./datastore-objects/game');
const { BattlePlayer, BattleMonster } = require("./datastore-objects/battle-agent");

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
        gameNotFound: "game not found",
        monsterInstanceNotFound: "monster instance not found",
        playerNotInGame: "Player not in game",
        battleNotFound: "Battle not found"
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
        const playerSnap = await this.#findPlayerbyPlatformId(id, platform);
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
            game = new Game();
            game.resetData(await GameModes.arena.createGame(this.#datasource));

            await this.#datasource.runTransaction(async (transaction) => {
                const transGameSnap = await transaction.get(gameRef);

               if(!transGameSnap.exists) {
                   transaction.create(gameRef, game.getData());
               }
           });
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
        const battlePlayerData = battlePlayer.getData();
        const monster = new BattleMonster(battle.monster);
        const monsterData = monster.getData()
        
        const monsterActionRequest = monsterAi.genericAi(battle);

        //Proccess battle actions
        //player action
        const playerAction = this.#createBattleAction(actionRequest, battlePlayerData);
        //monster action
        const monsterAction = this.#createBattleAction(monsterActionRequest, monsterData);

        const steps = [];
        if(playerAction.speed > monsterAction.speed) {
            steps.push(...this.#executeActionPhase(battlePlayerData, playerAction, monsterData, monsterAction));
        }
        else if(playerAction.speed < monsterAction.speed) {
            steps.push(...this.#executeActionPhase(monsterData, monsterAction, battlePlayerData, playerAction));
        }

        if(battlePlayer.isDefeated() || monster.isDefeated()) {
            const result = {};
            const playerRef = this.#datasource.collection(Schema.Collections.Accounts).doc(battlePlayerData.id);
            const player = new Player((await playerRef.get()).data());

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
                const willDropWeapon = chatRPGUtility.getRandomIntInclusive(0, 1) && !player.hasWeapon(monsterData.weapon);

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

                // Remove battle fields and commit New Player data
                delete battlePlayerData.strikeLevel;
                delete battlePlayerData.ap;
                const finalPlayerData = Object.assign(player.getData(), battlePlayerData);
                await playerRef.set(finalPlayerData);
                
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
        if(battleAction.damage != null) {
            const damageStep = {
                actorId: srcPlayer.id
            };

            if(battleAction.name == 'strike') {
                damageStep.type = 'strike';
                srcPlayer.strikeLevel += 1;
                const modifier = srcPlayer.weapon.modifier ? srcPlayer.weapon.modifier : 'attack';
                
                if(srcPlayer.strikeLevel == STRIKE_ABILITY_TRIGGER) {
                    damageStep.description = `${srcPlayer.name} used ${srcPlayer.weapon.strikeAbility.name}!`;
                    srcPlayer.strikeLevel = 0;

                    damageStep.damage = this.#calculateDamage(srcPlayer, targetPlayer, srcPlayer.weapon.strikeAbility.baseDamage, modifier);
                }
                else {
                    damageStep.description = `${srcPlayer.name} strikes ${targetPlayer.name}!`;
                    damageStep.damage = this.#calculateDamage(srcPlayer, targetPlayer, srcPlayer.weapon.baseDamage, modifier);
                }
            }

            steps.push(damageStep);
            //Apply damage step
            targetPlayer.health -= Math.min(damageStep.damage, targetPlayer.health);
        }

        return steps;
    }

    #calculateDamage(srcPlayer, targetPlayer, baseDamage, modifier) {
        // make sure we don't devide by 0
        let defence = 1;
        if(targetPlayer.defence) {
            defence = targetPlayer.defence;
        }

        return Math.floor(((2 * srcPlayer.level / 5 + 2) * baseDamage * srcPlayer[modifier] / defence) / 50 + 2);
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