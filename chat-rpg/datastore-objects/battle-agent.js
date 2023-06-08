const {Agent, Monster} = require('./agent');

const BATTLE_AP = 3;

class BattleAgent extends Agent {
    constructor(objectData) {
        super(objectData)
    }

    constructNewObject(agent) {
        super.constructNewObject(agent);
        agent.ap = BATTLE_AP;
        agent.strikeLevel = 0;
        agent.id = 0;
    }
}

class BattlePlayer extends BattleAgent {
    constructor(objectData) {
        super(objectData)

        delete this.datastoreObject.bag.weapons;
        delete this.datastoreObject.bag.books;
    }

    constructNewObject(agent) {
        super.constructNewObject(agent);
        agent.bag = {};

    }
}

class BattleMonster extends Monster {
    constructor(objectData) {
        super(objectData)
    }

    constructNewObject(agent) {
        super.constructNewObject(agent);
        agent.weaponDropRate = 0.5;
    }
}

module.exports = {BattleAgent, BattlePlayer, BattleMonster};