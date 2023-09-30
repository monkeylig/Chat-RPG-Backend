const {Agent, Player} = require('./agent');
const {Monster} = require('./monster-class');
const { Weapon } = require('./weapon');

const BATTLE_AP = 3;
const STRIKE_ABILITY_TRIGGER = 2;
const MAX_STAT_AMP = 12;

const BattleAgent = {
    statAmpTable: {
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
    },

    setFields(agent) {
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

    statAmp(datastoreObject, statAmp, stages) {
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
    },

    getModifiedStat(datastoreObject, stat, statAmp) {
        return Math.max(datastoreObject[stat] * this.statAmpTable[datastoreObject[statAmp]], 1);
    },

    strengthAmp(datastoreObject, stages) {
        return this.statAmp(datastoreObject, 'strengthAmp', stages);
    },

    getModifiedStrength(datastoreObject) {
        return this.getModifiedStat(datastoreObject, 'strength', 'strengthAmp');
    },

    defenceAmp(datastoreObject, stages) {
        return this.statAmp(datastoreObject, 'defenceAmp', stages);
    },

    getModifiedDefence(datastoreObject) {
        return this.getModifiedStat(datastoreObject, 'defence', 'defenceAmp');
    },

    magicAmp(datastoreObject, stages) {
        return this.statAmp(datastoreObject, 'magicAmp', stages);
    },

    getModifiedMagic(datastoreObject) {
        return this.getModifiedStat(datastoreObject, 'magic', 'magicAmp');
    },

    onStrike(datastoreObject) {
        if (datastoreObject.strikeLevel < STRIKE_ABILITY_TRIGGER) {
            datastoreObject.strikeLevel += 1;
        }

        if(datastoreObject.ap < BATTLE_AP) {
            datastoreObject.ap += 1;
        }
    },

    onStrikeAbility(datastoreObject) {
        this.onStrike(datastoreObject);
        datastoreObject.strikeLevel = 0;
    },

    strikeAbilityReady(datastoreObject) {
        return datastoreObject.strikeLevel >= STRIKE_ABILITY_TRIGGER
    },

    onAbilityUsed(datastoreObject, ability) {
    
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
    },

    consumeEmpowermentValue(datastoreObject, type) {
        const value = BattleAgent.getEmpowermentValue(datastoreObject, type);
        datastoreObject.empowerment[type] = 0;
        return value;
    }
}

class BattlePlayer extends Agent {
    constructor(objectData) {
        super(objectData)
    }

    constructNewObject(agent) {
        super.constructNewObject(agent);
        BattleAgent.setFields(agent);
        agent.bag = {};
        agent.coins = 0;
        agent.lastDrops = {
            objects: []
        };
    }

    findObjectInBag(id) {
        return Player.findObjectInBag(this.datastoreObject, id);
    }

    findObjectInBagByName(itemName) {
        return Player.findObjectInBagByName(this.datastoreObject, itemName);
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

    strengthAmp(stages) {
        return BattleAgent.strengthAmp(this.datastoreObject, stages);
    }

    getModifiedStrength() {
        return BattleAgent.getModifiedStrength(this.datastoreObject);
    }

    defenceAmp(stages) {
        return BattleAgent.defenceAmp(this.datastoreObject, stages);
    }

    getModifiedDefence() {
        return BattleAgent.getModifiedDefence(this.datastoreObject);
    }

    magicAmp(stages) {
        return BattleAgent.magicAmp(this.datastoreObject, stages);
    }

    getModifiedMagic() {
        return BattleAgent.getModifiedMagic(this.datastoreObject);
    }

    addEmpowerment(type, value) {
        BattleAgent.addEmpowerment(this.datastoreObject, type, value);
    }

    getEmpowermentValue(type) {
        return BattleAgent.getEmpowermentValue(this.datastoreObject, type);
    }

    consumeEmpowermentValue(type) {
        return BattleAgent.consumeEmpowermentValue(this.datastoreObject, type);
    }

    addCoins(coins) {
        Player.addCoins(this.datastoreObject, coins);
    }

    addObjectToLastDrops(object, type) {
        Player.addObjectToLastDrops(this.datastoreObject, object, type);
    }

    clearLastDrops() {
        Player.clearLastDrops(this.datastoreObject);
    }
    
    addWeaponToBag(weapon) {
        return Player.addWeaponToBag(this.datastoreObject, weapon);
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

    strengthAmp(stage) {
        return BattleAgent.strengthAmp(this.datastoreObject, stage);
    }

    getModifiedStrength() {
        return BattleAgent.getModifiedStrength(this.datastoreObject);
    }

    defenceAmp(stages) {
        return BattleAgent.defenceAmp(this.datastoreObject, stages);
    }

    getModifiedDefence() {
        return BattleAgent.getModifiedDefence(this.datastoreObject);
    }

    magicAmp(stages) {
        return BattleAgent.magicAmp(this.datastoreObject, stages);
    }

    getModifiedMagic() {
        return BattleAgent.getModifiedMagic(this.datastoreObject);
    }

    addEmpowerment(type, value) {
        BattleAgent.addEmpowerment(this.datastoreObject, type, value);
    }

    getEmpowermentValue(type) {
        return BattleAgent.getEmpowermentValue(this.datastoreObject, type);
    }

    consumeEmpowermentValue(type) {
        return BattleAgent.consumeEmpowermentValue(this.datastoreObject, type);
    }
}

class BattleWeapon extends Weapon {
    constructNewObject(weapon) {
        super.constructNewObject(weapon);
        weapon.speedAmp = 0;
    }

    speedAmp(stages) {
        return BattleAgent.statAmp(this.datastoreObject, 'speedAmp', stages)
    }

    getModifiedSpeed() {
        return BattleAgent.getModifiedStat(this.datastoreObject, 'speed', 'speedAmp');
    }
}

module.exports = {BattlePlayer, BattleMonster, BattleWeapon, BattleAgent};