const { BattleAgent } = require("../datastore-objects/battle-agent");
const { ActionCreatorType } = require("./action-generator");

/**
 * @implements {ActionGeneratorCreator}
 */
class BattleMove {    
    /**
     * 
     * @param {BattleAgent} owner 
     */
    constructor(owner) {
        this.owner = owner;
        this.creatorType = ActionCreatorType.None;
    }

    getInputData() {
        return {};
    }

    activate(battleContext){

    }
};

module.exports = {BattleMove};