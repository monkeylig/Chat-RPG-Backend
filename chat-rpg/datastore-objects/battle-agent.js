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

const statAmpTable = {
    '-12': 0.25,
    '-11': 0.2675,
    '-10': 0.285,
    '-9': 0.3075,
    '-8': 0.33,
    '-7': 0.365,
    '-6': 0.4,
    '-5': 0.45,
    '-4': 0.5,
    '-3': 0.58,
    '-2': 0.66,
    '-1': 0.80,
    '0': 1,
    '1': 1.25,
    '2': 1.5,
    '3': 1.75,
    '4': 2,
    '5': 2.25,
    '6': 2.5,
    '7': 2.75,
    '8': 3,
    '9': 3.25,
    '10': 3.5,
    '11': 3.75,
    '12': 4
};

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
 * @returns {number}
 */
function getModifiedStat(datastoreObject, stat, statAmp) {
    let modifier = Math.abs(datastoreObject[statAmp]) * 0.25 + 1;
    if (datastoreObject[statAmp] < 0) {
        modifier = 1/modifier;
    }
    return Math.max(datastoreObject[stat] * modifier, 1);
}

/**
 * @typedef {AgentData & {
 * weapon: BattleWeaponData,
 * ap: number,
 * maxAp: number,
 * strikeLevel: number, 
 * id: string,
 * strengthAmp: number, 
 * defenseAmp: number, 
 * magicAmp: number, 
 * reviveReady: boolean, 
 * empowerment: object,
 * protection: object,
 * statusEffects: object,
 * fireResist: number,
 * lightningResist: number,
 * waterResist: number,
 * iceResist: number,
 * fireResistAmp: number,
 * lightningResistAmp: number,
 * waterResistAmp: number,
 * iceResistAmp: number,
 * counter: object,
 * abilityStrikes: object[],
 * evasion: number
 * }} BattleAgentData
 */

/**
 * @template {AgentConstructor} TBase
 * @param {TBase} Base 
 */
function BattleAgentMixin(Base) {
    return class BattleAgent extends Base {
        STRIKE_ABILITY_TRIGGER = 2;
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

        getModifiedStat(stat, statAmp) {
            return getModifiedStat(this.datastoreObject, stat, statAmp);
        }

        strengthAmp(stages) {
            return this.statAmp('strengthAmp', stages);
        }

        getModifiedStrength() {
            return this.getModifiedStat('strength', 'strengthAmp');
        }

        defenseAmp(stages) {
            return this.statAmp('defenseAmp', stages);
        }

        getModifiedDefense() {
            return this.getModifiedStat('defense', 'defenseAmp');
        }

        magicAmp(stages) {
            return this.statAmp('magicAmp', stages);
        }

        getModifiedMagic() {
            return this.getModifiedStat('magic', 'magicAmp');
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

        setStrikeLevel(value) {
            if (value > this.STRIKE_ABILITY_TRIGGER || value < 0) {
                return;
            }

            this.datastoreObject.strikeLevel = value;
        }

        changeStrikeLevel(value) {
            const newValue = Math.max(0, Math.min(this.STRIKE_ABILITY_TRIGGER, this.datastoreObject.strikeLevel + value));
            this.setStrikeLevel(newValue);
        }

        onStrike() {
            this.setStrikeLevel(this.datastoreObject.strikeLevel + 1);

            if(this.datastoreObject.ap < BATTLE_AP) {
                this.datastoreObject.ap += 1;
            }
        }

        onStrikeAbility() {
            //this.onStrike(); Testing balance without this
            this.datastoreObject.strikeLevel = 0;
        }

        strikeAbilityReady() {
            return this.datastoreObject.strikeLevel >= this.STRIKE_ABILITY_TRIGGER
        }

        onAbilityUsed(ability) {

        }

        addEmpowerment(type, value) {
            if(!this.datastoreObject.empowerment.hasOwnProperty(type)) {
                this.datastoreObject.empowerment[type] = 0;
            }

            this.datastoreObject.empowerment[type] += value;
        }

        getEmpowermentValue(type) {
            if(!this.datastoreObject.empowerment.hasOwnProperty(type)) {
                this.datastoreObject.empowerment[type] = 0;
            }

            return this.datastoreObject.empowerment[type];
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

        consumeEmpowermentValue(type) {
            const value = this.getEmpowermentValue(type);
            this.datastoreObject.empowerment[type] = 0;
            return value;
        }

        addStatusEffect(name, statusEffect) {
            this.datastoreObject.statusEffects[name] = Object.assign({}, statusEffect);
        }

        getStatusEffect(name) {
            return this.datastoreObject.statusEffects[name];
        }

        removeStatusEffect(name) {
            delete this.datastoreObject.statusEffects[name];
        }

        /**
         * 
         * @param {Ability} counterAbility The ability to be used as a counter
         * @param {string} counterType The type of counter. 'strike' to counter a strike
         */
        setCounter(counterAbility, counterType) {
            this.datastoreObject.counter = {
                type: counterType,
                ability: counterAbility.getData()
            };
        }

        getCounter(counterType) {
            if(this.datastoreObject.counter && this.datastoreObject.counter.type === counterType) {
                return this.datastoreObject.counter;
            }
        }

        clearCounter() {
            this.datastoreObject.counter = null;
        }

        addAbilityStrike(ability, durationCondition) {
            this.datastoreObject.abilityStrikes.push({
                durationCondition,
                ability: ability.getData()
            });
        }

        removeAbilityStrike(abilityIndex) {
            const abilityStrikes = this.datastoreObject.abilityStrikes;

            if(abilityIndex >= abilityStrikes.length) {
                return;
            }

            abilityStrikes.splice(abilityIndex, 1);
        }

        getAbilityStrikes() {
            return this.datastoreObject.abilityStrikes;
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
     * Imbue a weapon with an element
     * @param {string} element The element to add to this weapon 
     * @param {string | null} [durationCondition] How long this weapon stays imbued. null(default) or 'infinite' for infinite or 'strikeAbility' until the next strike ability
     */
    imbue(element, durationCondition = null) {
        this.datastoreObject.imbuements[element] = {durationCondition};
    }

    removeImbue(element) {
        this.datastoreObject.imbuements[element] = null;
    }

    getImbuedElements() {
        const elements = [];
        const imbuements = this.datastoreObject.imbuements;

        for(const element in imbuements) {
            if(imbuements[element]) {
                elements.push(element);
            }
        }

        return elements;
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