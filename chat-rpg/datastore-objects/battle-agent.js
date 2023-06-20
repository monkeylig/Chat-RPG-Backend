const {Agent, Player} = require('./agent');
const {Monster} = require('./monster-class');

const BATTLE_AP = 3;
const STRIKE_ABILITY_TRIGGER = 3;
const MAX_ATTACK_AMP = 12;

const BattleAgent = {
    setFields(agent) {
        agent.ap = BATTLE_AP;
        agent.strikeLevel = 0;
        agent.id = 0;
        agent.attack = 0;
        agent.attackAmp = 0;
    },

    slightAttackAmp(datastoreObject) {
        if(datastoreObject.attackAmp < MAX_ATTACK_AMP) {
            datastoreObject.attackAmp += 1;
        }
    },

    getModifiedAttack(datastoreObject) {
        return datastoreObject.attack + datastoreObject.attack * (datastoreObject.attackAmp / MAX_ATTACK_AMP);
    },

    onStrike(datastoreObject) {
        if(datastoreObject.strikeLevel < STRIKE_ABILITY_TRIGGER) {
            datastoreObject.strikeLevel += 1;
            if(datastoreObject.ap < BATTLE_AP) {
                datastoreObject.ap += 1;
            }
        }
    },

    strikeAbilityReady(datastoreObject) {
        return datastoreObject.strikeLevel === STRIKE_ABILITY_TRIGGER
    },

    onAbilityUsed(datastoreObject, ability) {
        datastoreObject.ap -= ability.apCost;

        if(datastoreObject.ap < 0) {
            datastoreObject.ap = 0;
        }
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

    strikeAbilityReady() {
        return BattleAgent.strikeAbilityReady(this.datastoreObject);
    }

    onItemUsed(item) {
        Player.onItemUsed(this.datastoreObject, item);
    }

    onAbilityUsed(ability) {
        BattleAgent.onAbilityUsed(this.datastoreObject, ability);
    }

    slightAttackAmp() {
        BattleAgent.slightAttackAmp(this.datastoreObject);
    }

    getModifiedAttack() {
        return BattleAgent.getModifiedAttack(this.datastoreObject);
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

    strikeAbilityReady() {
        return BattleAgent.strikeAbilityReady(this.datastoreObject);
    }
    
    onAbilityUsed(ability) {
        BattleAgent.onAbilityUsed(this.datastoreObject, ability);
    }

    slightAttackAmp() {
        BattleAgent.slightAttackAmp(this.datastoreObject);
    }

    getModifiedAttack() {
        return BattleAgent.getModifiedAttack(this.datastoreObject);
    }
}

module.exports = {BattlePlayer, BattleMonster};