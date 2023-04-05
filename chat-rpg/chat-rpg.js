const Schema = require("./datasource-schema");
const GameModes = require("./game-modes");
const monsterAi = require("./monster-ai/monster-ai");
const chatRPGUtility = require('./utility');

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
        const player = {
            name: name,
            avatar: avatar,
            exp: 0,
            abilities: '',
            weapon: chatRPGUtility.defultWeapon,
            currentGameId: 0
        };

        chatRPGUtility.setStatsAtLevel(player, player.weapon.statGrowth, 1);

        const platformIdProperty = this.#getPlatformIdProperty(platform);
        player[platformIdProperty] = platformId;
        const playersRef = this.#datasource.collection(Schema.Collections.Accounts);

        const query = playersRef.where(platformIdProperty, '==', platformId);
        const result = await this.#datasource.runTransaction(async (transaction) => {
            const playerQuery = await transaction.get(query);

            if(!playerQuery.empty) {
                throw new Error(ChatRPG.Errors.playerExists);
            }

            const newPlayer = playersRef.doc();
            transaction.create(newPlayer, player);

            return newPlayer.id;
        });

        return result;
    }

    async findPlayerById(id, platform) {
        const playerSnap = await this.#findPlayerbyPlatformId(id, platform);
        const playerData = playerSnap.data();
        playerData.id = playerSnap.ref.id;
        return playerData;
    }

    async joinGame(playerId, gameId) {
        //Make sure the user exists
        const player = await this.#findPlayer(playerId);

        const gameRef = this.#datasource.collection(Schema.Collections.Games).doc(gameId);

        //TODO the host's game mode from the config

        const gameData = await this.#datasource.runTransaction(async (transaction) => {
             const game = await transaction.get(gameRef);

            if(!game.exists) {
                const gameData = await GameModes.arena.createGame(this.#datasource);
                gameData.monsters = this.#flattenObjectArray(gameData.monsters);
                transaction.create(gameRef, gameData);

                return gameData;
            }

            return game.data();
        });

        const updateData = {};
        updateData[Schema.AccountFields.CurrentGameId] = gameId;
        await player.ref.update(updateData);
        
        gameData.monsters = this.#unflattenObjectArray(gameData.monsters);
        gameData.id = gameRef.id;
        return gameData;
        
    }

    async startBattle(playerId, gameId, monsterId) {
        const player = await this.#findPlayer(playerId);
        const game = await this.#findGame(gameId);

        const playerData = player.data();
        if(playerData.currentGameId != game.ref.id) {
            throw new Error(ChatRPG.Errors.playerNotInGame);
        }

        const monsters = this.#unflattenObjectArray(game.data().monsters);

        let targetMonster;

        monsters.forEach((monster) => {
            if(monster.id == monsterId) {
                targetMonster = monster;
            }
        });

        if(!targetMonster) {
            throw new Error(ChatRPG.Errors.monsterInstanceNotFound);
        }

        const battle = {
            player: {
                id: player.ref.id,
                name: playerData.name,
                avatar: playerData.avatar,
                health: playerData.health,
                maxHealth: playerData.maxHealth,
                attack: playerData.attack,
                defence: playerData.defence,
                magic: playerData.magic,
                weapon: playerData.weapon,
                level: playerData.level,
                exp: playerData.exp,
                expToNextLevel: playerData.expToNextLevel,
                ap: BATTLE_AP,
                strikeLevel: 0
            },
            monster: {
                id: targetMonster.id,
                name: targetMonster.name,
                avatar: targetMonster.avatar,
                health: targetMonster.health,
                maxHealth: targetMonster.maxHealth,
                attack: targetMonster.attack,
                defence: targetMonster.defence,
                magic: targetMonster.magic,
                weapon: targetMonster.weapon,
                level: targetMonster.level,
                expYield: targetMonster.expYield,
                ap: BATTLE_AP,
                strikeLevel: 0
            },
            gameId: game.ref.id,
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
        const player = battle.player;
        const monster = battle.monster;
        
        const monsterActionRequest = monsterAi.genericAi(battle);

        //Proccess battle actions
        //player action
        const playerAction = this.#createBattleAction(actionRequest, player);
        //monster action
        const monsterAction = this.#createBattleAction(monsterActionRequest, monster);

        const steps = [];
        if(playerAction.speed > monsterAction.speed) {
            steps.push(...this.#executeActionPhase(player, playerAction, monster, monsterAction));
        }
        else if(playerAction.speed < monsterAction.speed) {
            steps.push(...this.#executeActionPhase(monster, monsterAction, player, playerAction));
        }

        if(this.#isDefeated(player) || this.#isDefeated(monster)) {
            const result = {};

            if(this.#isDefeated(player) && this.#isDefeated(monster)) {
                result.winner = null;
                steps.push({
                    type: "battle_end",
                    description: "The battle ended in a draw."
                });
            }
            else if(this.#isDefeated(player)) {
                result.winner = monster.id;
                steps.push({
                    type: "battle_end",
                    description: `${player.name} was defeated.`
                });
            }
            else if(this.#isDefeated(monster)) {
                const expGain = chatRPGUtility.getMonsterExpGain(monster);
                chatRPGUtility.addExpAndLevel(player, expGain, player.weapon.statGrowth);

                result.winner = player.id;
                result.expAward = expGain;

                steps.push({
                    type: "battle_end",
                    description: `${monster.name} was defeated!`
                });
            }

            return await this.#updateAndReturnBattleStatus({player, monster, steps, result}, battleSnap.ref.id);
        }

        return await this.#updateAndReturnBattleStatus({player, monster, steps}, battleSnap.ref.id);
    }

    async #updateAndReturnBattleStatus(battle, battleId) {
        await this.#datasource.collection(Schema.Collections.Battles).doc(battleId).update({
            player: battle.player,
            monster: battle.monster
        });

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

    #flattenObjectArray(array) {
        const newArray = [];

        array.forEach(element => {
            newArray.push(JSON.stringify(element));
        });

        return newArray;
    }

    #unflattenObjectArray(array) {
        const newArray = [];

        array.forEach(element => {
            newArray.push(JSON.parse(element));
        });

        return newArray;
    }
}

module.exports = ChatRPG;