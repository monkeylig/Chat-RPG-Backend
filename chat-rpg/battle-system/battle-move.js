const { BattleAgent } = require("../datastore-objects/battle-agent");
const { ActionGenerator } = require("./action-generator");
const { BattleContext } = require("./battle-context");
const { GeneratorCreatorType, ActionGeneratorCreator } = require("./battle-system-types");

class BattleMove extends ActionGeneratorCreator{    
    /**
     * 
     * @param {BattleAgent} owner 
     */
    constructor(owner) {
        super();
        this.owner = owner;
    }

    getInputData() {
        return {};
    }

    /**
     * 
     * @param {BattleContext} battleContext 
     * @returns {ActionGenerator}
     */
    onActivate(battleContext){
        const actionGenerator = new ActionGenerator(this.activate(battleContext))
        actionGenerator.inputData = this.getInputData();
        return actionGenerator;
    }

    /**
     * @param {BattleContext} battleContext
     * @returns {import("./action-generator").ActionGeneratorObject}
     */
    *activate(battleContext) {}
};

module.exports = {BattleMove};