/**
 * @import {MonsterData} from './monster-class'
 * @import {AgentData, BagHolderData} from './agent'
 * @import {GConstructor} from '../utility'
 * @import {WeaponData} from './weapon'
 */

const Ability = require('./ability');
const {Agent, Player, BagHolderMixin} = require('./agent');
const DatastoreObject = require('./datastore-object');
const {Monster} = require('./monster-class');
const { Weapon } = require('./weapon');

/**
 * @typedef {GConstructor<Agent>} AgentConstructor
 */

const BATTLE_AP = 3;
const MAX_STAT_AMP = 12;

function statAmp(datastoreObject, statAmp, stages) {
    let ampAmount = 0;
    stages = Math.floor(stages);
    if(stages > 0) {
        ampAmount = Math.min(stages, MAX_STAT_AMP - datastoreObject[statAmp]);
    }
    else if(stages < 0) {
        ampAmount = Math.max(stages, -MAX_STAT_AMP - datastoreObject[statAmp]);
    }

    datastoreObject[statAmp] += ampAmount;
    return ampAmount;
}

/**
 * 
 * @param {Object} datastoreObject 
 * @param {string} stat 
 * @param {string} statAmp 
 * @param {number} [min]
 * @returns {number}
 */
function getModifiedStat(datastoreObject, stat, statAmp, min) {
    let modifier = Math.abs(datastoreObject[statAmp]) * 0.25 + 1;
    if (datastoreObject[statAmp] < 0) {
        modifier = 1/modifier;
    }

    const result = datastoreObject[stat] * modifier;
    if (min !== undefined) {
        return Math.max(result, 1);
    }

    return result;
}

/**
 * @typedef {Object} _BattleAgentData
 * @property {BattleWeaponData} weapon - The agent's weapon
 * @property {number} ap
 * @property {number} maxAp
 * @property {number} strikeLevel
 * @property {string} id
 * @property {number} strengthAmp
 * @property {number} magicAmp
 * @property {object} protection
 * @property {number} fireResist
 * @property {number} lightningResist
 * @property {number} waterResist
 * @property {number} iceResist
 * @property {number} fireResistAmp
 * @property {number} lightningResistAmp
 * @property {number} waterResistAmp
 * @property {number} iceResistAmp
 * @property {number} evasion
 * 
 * @typedef {AgentData & _BattleAgentData} BattleAgentData
 */

/**
 * @template {AgentConstructor} TBase
 * @param {TBase} Base 
 */
function BattleAgentMixin(Base) {
    return class BattleAgent extends Base {
        MAX_STRIKE_LEVEL = 2;
        DEFAULT_STRIKE_ABILITY_COST = 2;
        /**
         * 
         * @param  {...any} objectData 
         */
        constructor(...objectData) {
            super(...objectData);
        }

        constructNewObject(agent) {
            super.constructNewObject(agent);
            agent.weapon = new BattleWeapon(agent.weapon).getData();
            agent.ap = BATTLE_AP;
            agent.maxAp = BATTLE_AP;
            agent.strikeLevel = 0;
            agent.id = '';
            agent.strengthAmp = 0;
            agent.defenseAmp = 0;
            agent.magicAmp = 0;
            agent.reviveReady = false;
            agent.empowerment = {
                magical: 0,
                physical: 0
            };
            agent.protection = {
                magical: 0,
                physical: 0
            };
            agent.statusEffects = {};
            agent.fireResist = 1;
            agent.lightningResist = 1;
            agent.waterResist = 1;
            agent.iceResist = 1;
            agent.fireResistAmp = 0;
            agent.lightningResistAmp = 0;
            agent.waterResistAmp = 0;
            agent.iceResistAmp = 0;
            agent.counter = null;
            agent.abilityStrikes = [];
            agent.evasion = 0;
        }

        statAmp(stat, stages) {
            return statAmp(this.datastoreObject, stat, stages);
        }

        /**
         * 
         * @param {string} stat 
         * @param {string} statAmp 
         * @param {number} [min] 
         * @returns 
         */
        getModifiedStat(stat, statAmp, min) {
            return getModifiedStat(this.datastoreObject, stat, statAmp, min);
        }

        strengthAmp(stages) {
            return this.statAmp('strengthAmp', stages);
        }

        getModifiedStrength() {
            return this.getModifiedStat('strength', 'strengthAmp', 1);
        }

        defenseAmp(stages) {
            return this.statAmp('defenseAmp', stages);
        }

        getModifiedDefense() {
            return this.getModifiedStat('defense', 'defenseAmp', 1);
        }

        magicAmp(stages) {
            return this.statAmp('magicAmp', stages);
        }

        getModifiedMagic() {
            return this.getModifiedStat('magic', 'magicAmp', 1);
        }

        fireResistAmp(stages) {
            return this.statAmp('fireResistAmp', stages);
        }

        getModifiedFireResist() {
            return this.getModifiedStat('fireResist', 'fireResistAmp');
        }

        lightningResistAmp(stages) {
            return this.statAmp('lightningResistAmp', stages);
        }

        getModifiedLightningResist() {
            return this.getModifiedStat('lightningResist', 'lightningResistAmp');
        }

        waterResistAmp(stages) {
            return this.statAmp('waterResistAmp', stages);
        }

        getModifiedWaterResist() {
            return this.getModifiedStat('waterResist', 'waterResistAmp');
        }

        iceResistAmp(stages) {
            return this.statAmp('iceResistAmp', stages);
        }

        getModifiedIceResist() {
            return this.getModifiedStat('iceResist', 'iceResistAmp');
        }

        getTotalElementalResistance(elements) {
            let totalResistance = 1;
            
            if(!elements) {
                return totalResistance;
            }

            for(const element of elements){
                switch(element) {
                    case 'fire':
                        totalResistance *= this.getModifiedFireResist();
                        break;
                    case 'lightning':
                        totalResistance *= this.getModifiedLightningResist();
                        break;
                    case 'water':
                        totalResistance *= this.getModifiedWaterResist();
                        break;
                    case 'ice':
                        totalResistance *= this.getModifiedIceResist();
                        break;
                }
            }

            return totalResistance;
        }

        changeStrikeLevel(value) {
            const newValue = Math.max(0, Math.min(this.MAX_STRIKE_LEVEL, this.datastoreObject.strikeLevel + value));

            this.getData().strikeLevel = newValue;
        }

        strikeAbilityReady() {
            return this.datastoreObject.strikeLevel >= this.MAX_STRIKE_LEVEL
        }

        addProtection(type, value) {
            if(!this.datastoreObject.protection.hasOwnProperty(type)) {
                this.datastoreObject.protection[type] = 0;
            }

            const hpValue = Math.max(this.datastoreObject.maxHealth * (value/100), 1);
            this.datastoreObject.protection[type] += hpValue;
            return hpValue;
        }

        getProtectionValue(type) {
            const protection = this.datastoreObject.protection;
            if(!protection.hasOwnProperty(type)) {
                protection[type] = 0;
            }

            return protection[type] / this.datastoreObject.maxHealth * 100;
        }

        /**
         * 
         * @param {number} initialDamage 
         * @param {string} [type] 
         * @returns {{totalDamage: number, protectedDamage: number}}
         */
        dealDamage(initialDamage, type) {
            let damage = initialDamage;
            const protection = this.datastoreObject.protection;
            let protectedDamage = 0;
            if(type && protection[type]) {
                protectedDamage = Math.min(protection[type], damage);
                protection[type] -= protectedDamage;
                damage -= protectedDamage;
            }

            const totalDamage = Math.min(this.datastoreObject.health, damage);
            this.datastoreObject.health -= totalDamage;
            return {totalDamage, protectedDamage};
        }

        /**
         * 
         * @param {number} speed 
         */
        setEvasiveSpeed(speed) {
            const maxEvasion = 0.3;
            this.getData().evasion = Math.max(0, speed/10 * maxEvasion);
        }

        /**
         * Returns the amount of AP that it costs to use this agent's strike ability
         */
        getStrikeAbilityCost() {
            const agent = this.getData();
            let apCost = agent.weapon.strikeAbility.apCost;
            if (!apCost) {
                apCost = this.DEFAULT_STRIKE_ABILITY_COST;
            }
            return Math.max(0, apCost - agent.strikeLevel);
        }

        /**
         * @override
         * @returns {BattleAgentData}
         */
        getData() {
            return /** @type {BattleAgentData} */ (this.datastoreObject);
        }
    }
}

class BattleAgent extends BattleAgentMixin(Agent){};

/**
 * @typedef {BattleAgentData & BagHolderData} BattlePlayerData
 * 
 */

/**
 * A version of the player class with data fields for battles
 */
class BattlePlayer extends BattleAgentMixin(BagHolderMixin(Agent)) {
    constructor(objectData) {
        super(objectData)
    }

    constructNewObject(agent) {
        super.constructNewObject(agent);
    }

    /**
     * @override
     * @returns {BattlePlayerData}
     */
    getData() {
        return /** @type {BattlePlayerData} */ (this.datastoreObject);
    }
}

/**
 * @typedef {BattleAgentData & MonsterData} BattleMonsterData
 * 
 */

/**
 * A version of the monster class with data fields for battles
 */
class BattleMonster extends BattleAgentMixin(Monster) {
    constructor(objectData) {
        super(objectData)
    }

    constructNewObject(agent) {
        super.constructNewObject(agent);
    }

    /**
     * @override
     * @returns {BattleMonsterData}
     */
    getData() {
        return /** @type {BattleMonsterData} */ (this.datastoreObject);
    }
}

/**
 * @typedef {WeaponData & {
* speedAmp: number,
* }} BattleWeaponData
*/

class BattleWeapon extends Weapon {
    constructNewObject(weapon) {
        super.constructNewObject(weapon);
        weapon.speedAmp = 0;
        weapon.imbuements = {};
    }

    speedAmp(stages) {
        return statAmp(this.datastoreObject, 'speedAmp', stages)
    }

    getModifiedSpeed() {
        const weapon = this.getData();
        return weapon.speed + weapon.speedAmp;
    }

    /**
     * @override
     * @returns {BattleWeaponData}
     */
    getData() {
        return /** @type {BattleWeaponData} */ (this.datastoreObject);
    }
}

module.exports = {BattlePlayer, BattleMonster, BattleWeapon, BattleAgent};