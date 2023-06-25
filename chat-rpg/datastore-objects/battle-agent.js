const {Agent, Player} = require('./agent');
const {Monster} = require('./monster-class');

const BATTLE_AP = 3;
const STRIKE_ABILITY_TRIGGER = 2;
const MAX_STAT_AMP = 12;

const BattleAgent = {
    setFields(agent) {
        agent.ap = BATTLE_AP;
        agent.strikeLevel = 0;
        agent.id = 0;
        agent.attack = 0;
        agent.defence = 0;
        agent.attackAmp = 0;
        agent.defenceAmp = 0;
        agent.empowerment = {
            strike: 0
        };
    },

    statAmp(datastoreObject, statAmp, stages) {
        if(datastoreObject[statAmp] < MAX_STAT_AMP) {
            datastoreObject[statAmp] += Math.min(stages, MAX_STAT_AMP - datastoreObject[statAmp]);
            return true;
        }
    
        return false;
    },

    getModifiedStat(datastoreObject, stat, statAmp) {
        return Math.max(datastoreObject[stat] + datastoreObject[stat] * (datastoreObject[statAmp] / MAX_STAT_AMP), 1);
    },

    attackAmp(datastoreObject, stages) {
        return this.statAmp(datastoreObject, 'attackAmp', stages);
    },

    getModifiedAttack(datastoreObject) {
        return this.getModifiedStat(datastoreObject, 'attack', 'attackAmp');
    },

    defenceAmp(datastoreObject, stages) {
        return this.statAmp(datastoreObject, 'defenceAmp', stages);
    },

    getModifiedDefence(datastoreObject) {
        return this.getModifiedStat(datastoreObject, 'defence', 'defenceAmp');
    },

    onStrike(datastoreObject) {
            if (datastoreObject.strikeLevel < STRIKE_ABILITY_TRIGGER) {
                datastoreObject.strikeLevel += 1;
            }

            if(datastoreObject.ap < BATTLE_AP) {
                datastoreObject.ap += 1;
            }

        datastoreObject.empowerment.strike = 0;
    },

    onStrikeAbility(datastoreObject) {
        datastoreObject.strikeLevel = 0;
    },

    strikeAbilityReady(datastoreObject) {
        return datastoreObject.strikeLevel >= STRIKE_ABILITY_TRIGGER
    },

    onAbilityUsed(datastoreObject, ability) {
        datastoreObject.ap -= ability.datastoreObject.apCost;

        if(datastoreObject.ap < 0) {
            datastoreObject.ap = 0;
        }
    },

    addEmpowerment(datastoreObject, type, value) {
        if(!datastoreObject.empowerment.hasOwnProperty(type)) {
            datastoreObject.empowerment[type] = 0;
        }

        datastoreObject.empowerment[type] += value;
    },

    getEmpowermentValue(datastoreObject, type) {
        if(!datastoreObject.empowerment.hasOwnProperty(type)) {
            datastoreObject.empowerment[type] = 0;
        }

        return datastoreObject.empowerment[type];
    }
}

class BattlePlayer extends Agent {
    constructor(objectData) {
        super(objectData)

        delete this.datastoreObject.bag.weapons;
        delete this.datastoreObject.bag.books;
    }

    constructNewObject(agent) {
        super.constructNewObject(agent);
        BattleAgent.setFields(agent);
        agent.bag = {};
        agent.bag.items = [];
    }

    findItemByName(itemName) {
        return Player.findItemByName(this.datastoreObject, itemName);
    }

    onStrike() {
        BattleAgent.onStrike(this.datastoreObject);
    }

    onStrikeAbility() {
        BattleAgent.onStrikeAbility(this.datastoreObject);
    }

    strikeAbilityReady() {
        return BattleAgent.strikeAbilityReady(this.datastoreObject);
    }

    onItemUsed(item) {
        Player.onItemUsed(this.datastoreObject, item);
    }

    onAbilityUsed(ability) {
        BattleAgent.onAbilityUsed(this.datastoreObject, ability);
    }

    attackAmp(stages) {
        return BattleAgent.attackAmp(this.datastoreObject, stages);
    }

    getModifiedAttack() {
        return BattleAgent.getModifiedAttack(this.datastoreObject);
    }

    defenceAmp(stages) {
        return BattleAgent.defenceAmp(this.datastoreObject, stages);
    }

    getModifiedDefence() {
        return BattleAgent.getModifiedDefence(this.datastoreObject);
    }

    addEmpowerment(type, value) {
        BattleAgent.addEmpowerment(this.datastoreObject, type, value);
    }

    getEmpowermentValue(type) {
        return BattleAgent.getEmpowermentValue(this.datastoreObject, type);
    }
}

class BattleMonster extends Monster {
    constructor(objectData) {
        super(objectData)
    }

    constructNewObject(agent) {
        super.constructNewObject(agent);
        BattleAgent.setFields(agent);
    }

    onStrike() {
        BattleAgent.onStrike(this.datastoreObject);
    }

    onStrikeAbility() {
        BattleAgent.onStrikeAbility(this.datastoreObject);
    }

    strikeAbilityReady() {
        return BattleAgent.strikeAbilityReady(this.datastoreObject);
    }
    
    onAbilityUsed(ability) {
        BattleAgent.onAbilityUsed(this.datastoreObject, ability);
    }

    attackAmp(stage) {
        BattleAgent.attackAmp(this.datastoreObject, stage);
    }

    getModifiedAttack() {
        return BattleAgent.getModifiedAttack(this.datastoreObject);
    }

    defenceAmp(stages) {
        return BattleAgent.defenceAmp(this.datastoreObject, stages);
    }

    getModifiedDefence() {
        return BattleAgent.getModifiedDefence(this.datastoreObject);
    }

    addEmpowerment(type, value) {
        BattleAgent.addEmpowerment(this.datastoreObject, type, value);
    }

    getEmpowermentValue(type) {
        return BattleAgent.getEmpowermentValue(this.datastoreObject, type);
    }
}

module.exports = {BattlePlayer, BattleMonster, BattleAgent};