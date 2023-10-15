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
        agent.defence = 0;
        agent.magic = 0;
        agent.strengthAmp = 0;
        agent.defenceAmp = 0;
        agent.magicAmp = 0;
        agent.reviveReady = false;
        agent.empowerment = {
            strike: 0,
            physical: 0
        };
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

    defenceAmp(stages) {
        return this.statAmp('defenceAmp', stages);
    },

    getModifiedDefence() {
        return this.getModifiedStat('defence', 'defenceAmp');
    },

    magicAmp(stages) {
        return this.statAmp('magicAmp', stages);
    },

    getModifiedMagic() {
        return this.getModifiedStat('magic', 'magicAmp');
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

    consumeEmpowermentValue(type) {
        const value = this.getEmpowermentValue(type);
        this.datastoreObject.empowerment[type] = 0;
        return value;
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
    }

    speedAmp(stages) {
        return statAmp(this.datastoreObject, 'speedAmp', stages)
    }

    getModifiedSpeed() {
        return getModifiedStat(this.datastoreObject, 'speed', 'speedAmp');
    }
}

module.exports = {BattlePlayer, BattleMonster, BattleWeapon};