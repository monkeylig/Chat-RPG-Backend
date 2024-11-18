/**
 * @import {BattleStep} from "./battle-steps"
 * @import {BattleData} from "../datastore-objects/battle"
 */

const { BattlePlayer, BattleWeapon, BattleAgent } = require("../datastore-objects/battle-agent");
const monsterAi = require("../monster-ai/monster-ai");
const chatRPGUtility = require("../utility");
const { BattleContext } = require("./battle-context");
const { StrikeAbilityBattleMove } = require("./strike-ability-battle-move");
const { StrikeBattleMove } = require("./strike-battle-move");
const ChatRPGErrors = require('../errors');
const Ability = require("../datastore-objects/ability");
const { AbilityBattleMove } = require("./ability-battle-move");
const Item = require("../datastore-objects/item");
const { ItemBattleMove } = require("./item-battle-move");
const BattleSteps = require("./battle-steps");
const { Weapon } = require("../datastore-objects/weapon");
const { Book } = require("../datastore-objects/book");
const content = require("../content/content");
const DatastoreObject = require("../datastore-objects/datastore-object");

/**
 * @typedef {Object} PlayerActionRequest
 * @property {string} battleId
 * @property {string} type
 * @property {string} [abilityName]
 * @property {string} [itemId]
 */

const ESCAPE_PRIORITY = 30000;
const ITEM_PRIORITY = 10000;
const LOW_LEVEL_COIN_DROP_RATE = 0.3;

/**
 * 
 */
class BattleSystem {
    #battleContext;

    /**
     * 
     * @param {BattleData} [battle] 
     */
    constructor(battle) {
        this.#battleContext = new BattleContext(battle);
    }

    get battleContext() {
        return this.#battleContext;
    }

    /**
     * Executes a move that a player has chosen to make
     * @param {PlayerActionRequest} playerActionRequest 
     * @returns {BattleStep[]}
     */
    singlePlayerBattleIteration(playerActionRequest) {
        const steps = [];
        if(playerActionRequest.type === 'escape') {
            const battle = this.#battleContext.battle;
            steps.push(BattleSteps.info(`${battle.player.name} escaped.`, 'escape', battle.player.id));
            steps.push(BattleSteps.battleEnd(this.#battleContext.battle, 'escape', null));
            return steps;
        }

        steps.push(...this.#battleContext.beginRound());
        const monsterActionRequest = monsterAi.genericAi(this.#battleContext.monster, this.#battleContext.player, this.#battleContext.battle);

        const playerMove = this.createBattleAction(playerActionRequest, this.#battleContext.player);
        const monsterMove = this.createBattleAction(monsterActionRequest, this.#battleContext.monster);

        steps.push(...this.executeBattleIteration(this.#battleContext.player, playerMove, this.#battleContext.monster, monsterMove));

        steps.push(...this.#battleContext.endRound());
        steps.push(...this.checkEndOfGame());

        return steps;
    }

    /**
     * 
     * @returns {BattleStep[]}
     */
    checkEndOfGame() {
        const battlePlayer = this.#battleContext.player;
        const battleMonster = this.#battleContext.monster;

        if(battlePlayer.isDefeated() && battleMonster.isDefeated()) {
            return [
                BattleSteps.info("The battle ended in a draw."),
                BattleSteps.battleEnd(this.#battleContext.battle, 'draw', null)
            ];
        }
        else if(battlePlayer.isDefeated()) {
            return [
                BattleSteps.info(`${battlePlayer.getData().name} was defeated.`),
                BattleSteps.battleEnd(this.#battleContext.battle, 'defeat', battleMonster.getData().id)
            ];
        }
        else if(battleMonster.isDefeated()) {
            const battle = this.#battleContext.battle;
            const steps = [
                BattleSteps.info(`${battleMonster.getData().name} was defeated!`),
                BattleSteps.battleEnd(battle, 'victory', battlePlayer.getData().id)
            ];
            if(!battle.result) {
                battle.result = {
                    status: 'victory',
                    winner: battle.player.id,
                    expAward: 0,
                    levelGain: 0,
                    drops: []
                };
            }

            //Level up player
            const expGain = battleMonster.getExpGain();
            const oldLevel = battlePlayer.getData().level;
            battlePlayer.addExpAndLevel(expGain);
            
            const result = battle.result;
            result.expAward = expGain;
            result.levelGain = battlePlayer.getData().level - oldLevel;
            result.drops = [];
            battlePlayer.clearLastDrops();
    
            // Compute the monster drops
            //Check for generic drops
            for (const equipDrop of battleMonster.getData().drops) {
                const willDrop = chatRPGUtility.chance(equipDrop.dropRate);

                if (willDrop) {
                    const drop = {
                        type: equipDrop.type,
                        content: equipDrop.content,
                        bagFull: false
                    }

                    /**@type {DatastoreObject | undefined} */
                    let droppedObject;
                    if (equipDrop.type === 'weapon') {
                        droppedObject = new Weapon(equipDrop.content);
                    }

                    if (droppedObject) {
                        if(!battlePlayer.addObjectToBag(droppedObject.getData(), drop.type)) {
                            drop.bagFull = true;
                            battlePlayer.addObjectToLastDrops(droppedObject.getData(), 'weapon');
                        }
                        result.drops.push(drop);
                    }
                }
            }
    
            //Check for coin drops
            let shouldDropCoin = oldLevel <= battleMonster.getData().level || chatRPGUtility.chance(LOW_LEVEL_COIN_DROP_RATE);
            const coinBonus = Math.max((battleMonster.getData().level - oldLevel) * Math.floor(battleMonster.getData().coinDrop/2), 0);
            if(battleMonster.getData().coinDrop > 0 && shouldDropCoin) {
                const coinReward = battleMonster.getData().coinDrop + coinBonus;
                const drop = {
                    type: 'coin',
                    content: {
                        name: `${coinReward} coins`,
                        icon: 'coin.webp'
                    }
                };
                battlePlayer.addCoins(coinReward);
                result.drops.push(drop);
            }
    
            // Check for unlocked abilities
            for(const bagItem of battlePlayer.getData().bag.objects) {
                if(bagItem.type !== 'book') {
                    continue;
                }
    
                const unlockedAbilities = Book.updateAbilityRequirements(bagItem.content, battlePlayer, battle);
    
                if(unlockedAbilities.length > 0) {
                    const drop = {
                        type: 'abilitiesUnlock',
                        content: {
                            name: `Ability unlocked from ${bagItem.content.name}!`
                        },
                        description: `Abilities unlocked from ${bagItem.content.name}!`
                    };
    
                    result.drops.push(drop);
                }
            }

            //Need to check but may not need to reassign the player data to the battle
            battle.player = battlePlayer.getData();
            battle.monster = battleMonster.getData();
            return steps;
        }
        return [];
    }

    /**
     * @typedef {Object} BattleMoveRequest
     * @property {string} type
     * @property {number} speed
     * @property {number} priority
     * @property {Ability} [ability]
     * @property {Item} [item]
     * 
     * @param {PlayerActionRequest} actionRequest 
     * @param {BattleAgent} battlePlayer
     * @returns {BattleMoveRequest}
     */
    createBattleAction(actionRequest, battlePlayer) {
        battlePlayer.getData().evasion = 0;
        /** @type {BattleMoveRequest} */
        let battleMove = {
            type: actionRequest.type,
            speed: 0,
            priority: 0            
        };
        if(actionRequest.type === 'strike') {
            battleMove.speed = new BattleWeapon(battlePlayer.getData().weapon).getModifiedSpeed();
            battlePlayer.setEvasiveSpeed(battleMove.speed);
        }
        else if(actionRequest.type === 'ability') {
            const abilityData = battlePlayer.findAbilityByName(actionRequest.abilityName);
            if(!abilityData) {
                throw new Error(ChatRPGErrors.abilityNotEquipped);
            }
            const ability = new Ability(abilityData);

            const apCost = ability.getData().apCost;
            if(apCost && battlePlayer.getData().ap < apCost) {
                throw new Error(ChatRPGErrors.notEnoughAp);
            }

            const abilitySpeed = ability.getData().speed;
            const abilityPriority = ability.getData().priority;
            battleMove.ability = ability;
            battleMove.speed = abilitySpeed ? abilitySpeed : 3;
            battleMove.priority = abilityPriority ? abilityPriority : 0;
            battlePlayer.setEvasiveSpeed(battleMove.speed);
        }
        else if(actionRequest.type === 'item' && actionRequest.itemId) {
            const humanPlayer = /** @type {BattlePlayer} */(battlePlayer);
            const itemObject = humanPlayer.findObjectInBag(actionRequest.itemId);
            if(!itemObject) {
                throw new Error(ChatRPGErrors.itemNotEquipped);
            }
            const item = new Item(itemObject.content);
            battleMove.item = item;
            battleMove.priority = ITEM_PRIORITY;
        }
        else if(actionRequest.type === 'escape') {
            battleMove.priority = ESCAPE_PRIORITY;
        }
        return battleMove;
    }

    /**
     * @param {BattleAgent} agent1
     * @param {BattleMoveRequest} agent1Move
     * @param {BattleAgent} agent2 
     * @param {BattleMoveRequest} agent2Move 
     * @returns {BattleStep[]}
     */
    executeBattleIteration(agent1, agent1Move, agent2, agent2Move) {
        const randumInt = chatRPGUtility.getRandomIntInclusive(0, 1);
        let firstMove = randumInt ? agent1Move : agent2Move;
        let secondMove = !randumInt ? agent1Move : agent2Move;
        let firstAgent = randumInt ? agent1 : agent2;
        let secondAgent = !randumInt ? agent1 : agent2;

        if (agent1Move.priority > agent2Move.priority ||
            agent1Move.priority === agent2Move.priority && agent1Move.speed > agent2Move.speed) {
            firstMove = agent1Move;
            firstAgent = agent1;
            secondMove = agent2Move;
            secondAgent = agent2;
        }
        else if(agent1Move.priority < agent2Move.priority || 
            agent1Move.priority === agent2Move.priority && agent1Move.speed < agent2Move.speed) {
            firstMove = agent2Move;
            firstAgent = agent2;
            secondMove = agent1Move;
            secondAgent = agent1;
        }

        const checkdefeat = () => !firstAgent.isDefeated() && !secondAgent.isDefeated()
        /** @type {BattleStep[]} */
        const steps = [];
        if(checkdefeat()) {
            steps.push(...this.executeMove(firstAgent, secondAgent, firstMove));
        }

        if(checkdefeat()) {
            steps.push(...this.executeMove(secondAgent, firstAgent, secondMove));
        }

        return steps;
    }

    /**
     * 
     * @param {BattleAgent} agent 
     * @param {BattleAgent} opponent 
     * @param {BattleMoveRequest} agentMove
     * @returns {BattleStep[]}
     */
    executeMove(agent, opponent, agentMove) {
        if(agentMove.type === 'strike') {
            const strikeMove = agent.strikeAbilityReady() ? new StrikeAbilityBattleMove(agent) : new StrikeBattleMove(agent);
            this.#battleContext.activateBattleMove(strikeMove);
        }
        else if(agentMove.type === 'ability' && agentMove.ability) {
            const abilityMove = new AbilityBattleMove(agent, agentMove.ability.getData());
            this.#battleContext.activateBattleMove(abilityMove);
        }
        else if(agentMove.type === 'item' && agentMove.item) {
            const itemMove = new ItemBattleMove(agent, agentMove.item);
            this.#battleContext.activateBattleMove(itemMove);
        }

        return this.#battleContext.resolve();
    }
}

module.exports = {BattleSystem};