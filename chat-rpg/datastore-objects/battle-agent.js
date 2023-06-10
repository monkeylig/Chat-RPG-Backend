const {Agent, Player, Monster} = require('./agent');

const BATTLE_AP = 3;
const STRIKE_ABILITY_TRIGGER = 3;

const BattleAgent = {
    setFields(agent) {
        agent.ap = BATTLE_AP;
        agent.strikeLevel = 0;
        agent.id = 0;
    },

    onStrike(datastoreObject) {
        if(datastoreObject.strikeLevel < datastoreObject.strikeLevel) {
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

function battleAgentFields(agent) {
    agent.ap = BATTLE_AP;
    agent.strikeLevel = 0;
    agent.id = 0;
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

    findItemByName(itemName, flatten) {
        return Player.findItemByName(this.datastoreObject, itemName, flatten);
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
}

class BattleMonster extends Monster {
    constructor(objectData) {
        super(objectData)
    }

    constructNewObject(agent) {
        super.constructNewObject(agent);
        battleAgentFields(agent);
        agent.weaponDropRate = 0.5;
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
}

module.exports = {BattlePlayer, BattleMonster};