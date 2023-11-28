const Ability = require('./ability');
const {Agent, Player, BagHolderMixin} = require('./agent');
const {Monster} = require('./monster-class');
const { Weapon } = require('./weapon');

const BATTLE_AP = 3;
const STRIKE_ABILITY_TRIGGER = 2;
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
    '-1': 0.83,
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
    return ampAmount !== 0;
}

function getModifiedStat(datastoreObject, stat, statAmp) {
    return Math.max(datastoreObject[stat] * statAmpTable[datastoreObject[statAmp]], 1);
}

const BattleAgentMixin = {

    constructObject(agent) {
        agent.ap = BATTLE_AP;
        agent.strikeLevel = 0;
        agent.id = 0;
        agent.strength = 0;
        agent.defense = 0;
        agent.magic = 0;
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
        agent.lighteningResist = 1;
        agent.waterResist = 1;
        agent.iceResist = 1;
        agent.fireResistAmp = 0;
        agent.lighteningResistAmp = 0;
        agent.waterResistAmp = 0;
        agent.iceResistAmp = 0;
        agent.counter = null;
        agent.abilityStrikes = [];
    },

    statAmp(stat, stages) {
        return statAmp(this.datastoreObject, stat, stages);
    },

    getModifiedStat(stat, statAmp) {
        return getModifiedStat(this.datastoreObject, stat, statAmp);
    },

    strengthAmp(stages) {
        return this.statAmp('strengthAmp', stages);
    },

    getModifiedStrength() {
        return this.getModifiedStat('strength', 'strengthAmp');
    },

    defenseAmp(stages) {
        return this.statAmp('defenseAmp', stages);
    },

    getModifiedDefense() {
        return this.getModifiedStat('defense', 'defenseAmp');
    },

    magicAmp(stages) {
        return this.statAmp('magicAmp', stages);
    },

    getModifiedMagic() {
        return this.getModifiedStat('magic', 'magicAmp');
    },

    fireResistAmp(stages) {
        return this.statAmp('fireResistAmp', stages);
    },

    getModifiedFireResist() {
        return this.getModifiedStat('fireResist', 'fireResistAmp');
    },

    lighteningResistAmp(stages) {
        return this.statAmp('lighteningResistAmp', stages);
    },

    getModifiedLighteningResist() {
        return this.getModifiedStat('lighteningResist', 'lighteningResistAmp');
    },

    waterResistAmp(stages) {
        return this.statAmp('waterResistAmp', stages);
    },

    getModifiedWaterResist() {
        return this.getModifiedStat('waterResist', 'waterResistAmp');
    },

    iceResistAmp(stages) {
        return this.statAmp('iceResistAmp', stages);
    },

    getModifiedIceResist() {
        return this.getModifiedStat('iceResist', 'iceResistAmp');
    },

    onStrike() {
        if (this.datastoreObject.strikeLevel < STRIKE_ABILITY_TRIGGER) {
            this.datastoreObject.strikeLevel += 1;
        }

        if(this.datastoreObject.ap < BATTLE_AP) {
            this.datastoreObject.ap += 1;
        }
    },

    onStrikeAbility() {
        this.onStrike();
        this.datastoreObject.strikeLevel = 0;
    },

    strikeAbilityReady() {
        return this.datastoreObject.strikeLevel >= STRIKE_ABILITY_TRIGGER
    },

    onAbilityUsed(ability) {
    
    },

    addEmpowerment(type, value) {
        if(!this.datastoreObject.empowerment.hasOwnProperty(type)) {
            this.datastoreObject.empowerment[type] = 0;
        }

        this.datastoreObject.empowerment[type] += value;
    },

    getEmpowermentValue(type) {
        if(!this.datastoreObject.empowerment.hasOwnProperty(type)) {
            this.datastoreObject.empowerment[type] = 0;
        }

        return this.datastoreObject.empowerment[type];
    },

    addProtection(type, value) {
        if(!this.datastoreObject.protection.hasOwnProperty(type)) {
            this.datastoreObject.protection[type] = 0;
        }

        const hpValue = Math.floor(this.datastoreObject.maxHealth * (value/100));
        this.datastoreObject.protection[type] += hpValue;
    },

    getProtectionValue(type) {
        const protection = this.datastoreObject.protection;
        if(!protection.hasOwnProperty(type)) {
            protection[type] = 0;
        }

        return protection[type] / this.datastoreObject.maxHealth * 100;
    },

    dealDamage(initialDamage, type) {
        let damage = Math.floor(initialDamage);
        const protection = this.datastoreObject.protection;
        if(type && protection[type]) {
            const protectedDamage = Math.min(protection[type], damage);
            protection[type] -= protectedDamage;
            damage -= protectedDamage;
        }

        this.datastoreObject.health -= Math.min(this.datastoreObject.health, damage);
    },

    consumeEmpowermentValue(type) {
        const value = this.getEmpowermentValue(type);
        this.datastoreObject.empowerment[type] = 0;
        return value;
    },

    addStatusEffect(name, statusEffect) {
        this.datastoreObject.statusEffects[name] = Object.assign({}, statusEffect);
    },

    getStatusEffect(name) {
        return this.datastoreObject.statusEffects[name];
    },

    removeStatusEffect(name) {
        delete this.datastoreObject.statusEffects[name];
    },

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
    },

    getCounter(counterType) {
        if(this.datastoreObject.counter && this.datastoreObject.counter.type === counterType) {
            return this.datastoreObject.counter;
        }
    },

    clearCounter() {
        this.datastoreObject.counter = null;
    },

    addAbilityStrike(ability, durationCondition) {
        this.datastoreObject.abilityStrikes.push({
            durationCondition,
            ability: ability.getData()
        });
    },

    removeAbilityStrike(abilityIndex) {
        const abilityStrikes = this.datastoreObject.abilityStrikes;

        if(abilityIndex >= abilityStrikes.length) {
            return;
        }

        abilityStrikes.splice(abilityIndex, 1);
    },

    getAbilityStrikes() {
        return this.datastoreObject.abilityStrikes;
    }
}

class BattlePlayer extends Agent {
    constructor(objectData) {
        super(objectData)
    }

    constructNewObject(agent) {
        super.constructNewObject(agent);
        BattleAgentMixin.constructObject(agent);
        BagHolderMixin.constructObject(agent);
    }
}
Object.assign(BattlePlayer.prototype, BattleAgentMixin);
Object.assign(BattlePlayer.prototype, BagHolderMixin);

class BattleMonster extends Monster {
    constructor(objectData) {
        super(objectData)
    }

    constructNewObject(agent) {
        super.constructNewObject(agent);
        BattleAgentMixin.constructObject(agent);
    }
}
Object.assign(BattleMonster.prototype, BattleAgentMixin);

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
        return getModifiedStat(this.datastoreObject, 'speed', 'speedAmp');
    }

    /**
     * Imbue a weapon with an element
     * @param {string} element The element to add to this weapon 
     * @param {string} durationCondition How long this weapon stays imbued. null(default) for infinite or 'strikeAbility' until the next strike ability
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
}

module.exports = {BattlePlayer, BattleMonster, BattleWeapon};