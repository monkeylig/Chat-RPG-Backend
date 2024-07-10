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

/**
 * @typedef {Object} PlayerActionRequest
 * @property {string} battleId
 * @property {string} type
 * @property {string} [abilityName]
 * @property {string} [itemId]
 */

const ESCAPE_PRIORITY = 30000;
const COUNTER_PRIORITY = 20000;
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

    get battle() {
        return this.#battleContext.battle;
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

        const monsterActionRequest = monsterAi.genericAi(this.#battleContext.monster, this.#battleContext.player, this.#battleContext.battle);

        const playerMove = this.createBattleAction(playerActionRequest, this.#battleContext.player);
        const monsterMove = this.createBattleAction(monsterActionRequest, this.#battleContext.monster);

        steps.push(...this.executeBattleIteration(this.#battleContext.player, playerMove, this.#battleContext.monster, monsterMove));

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
            //Check for weapon drops
            const willDropWeapon = chatRPGUtility.chance(battleMonster.getData().weaponDropRate);
    
            if(willDropWeapon) {
                const monsterWeapon = new Weapon(battleMonster.getData().weapon);
                const drop = {
                    type: 'weapon',
                    content: monsterWeapon.getData(),
                    bagFull: false
                };
    
                if(!battlePlayer.addWeaponToBag(monsterWeapon)) {
                    drop.bagFull = true;
                    battlePlayer.addObjectToLastDrops(monsterWeapon.getData(), 'weapon');
                }
                result.drops.push(drop);
            }
    
            //Check for coin drops
            let shouldDropCoin = oldLevel <= battleMonster.getData().level || chatRPGUtility.chance(LOW_LEVEL_COIN_DROP_RATE);
            if(battleMonster.getData().coinDrop > 0 && shouldDropCoin) {
                const drop = {
                    type: 'coin',
                    content: {
                        name: `${battleMonster.getData().coinDrop} coins`,
                        icon: 'coin.webp'
                    }
                };
                battlePlayer.addCoins(battleMonster.getData().coinDrop);
                result.drops.push(drop);
            }
    
            // Check for unlucked abilities
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
     * @property {Ability} [ability]
     * @property {Item} [item]
     * 
     * @param {PlayerActionRequest} actionRequest 
     * @param {BattleAgent} battlePlayer
     * @returns {BattleMoveRequest}
     */
    createBattleAction(actionRequest, battlePlayer) {
        /** @type {BattleMoveRequest} */
        let battleMove = {
            type: actionRequest.type,
            speed: 0
        };
        if(actionRequest.type === 'strike') {
            battleMove.speed = new BattleWeapon(battlePlayer.getData().weapon).getModifiedSpeed();
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

            battleMove = {
                type: 'ability',
                ability: ability,
                speed: ability.getData().speed
            }
        }
        else if(actionRequest.type === 'item' && actionRequest.itemId) {
            const humanPlayer = /** @type {BattlePlayer} */(battlePlayer);
            const itemObject = humanPlayer.findObjectInBag(actionRequest.itemId);
            if(!itemObject) {
                throw new Error(ChatRPGErrors.itemNotEquipped);
            }
            const item = new Item(itemObject.content);

            battleMove = {
                type: 'item',
                item: item,
                speed: ITEM_PRIORITY
            }
        }
        else if(actionRequest.type === 'escape') {
            battleMove = {
                type: 'escape',
                speed: ESCAPE_PRIORITY
            }
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

        if (agent1Move.speed > agent2Move.speed) {
            firstMove = agent1Move;
            firstAgent = agent1;
            secondMove = agent2Move;
            secondAgent = agent2;
        }
        else if(agent1Move.speed < agent2Move.speed) {
            firstMove = agent2Move;
            firstAgent = agent2;
            secondMove = agent1Move;
            secondAgent = agent1;
        }

        /** @type {BattleStep[]} */
        const steps = [];
        if(!firstAgent.isDefeated()) {
            steps.push(...this.executeMove(firstAgent, secondAgent, firstMove));
        }

        if(!secondAgent.isDefeated()) {
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
            const abilityMove = new AbilityBattleMove(agent, agentMove.ability);
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