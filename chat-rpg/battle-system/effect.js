const { BattleAgent } = require("../datastore-objects/battle-agent");
const { ActionCreatorType, ActionGenerator } = require("./action-generator");
const { BattleContext } = require("./battle-context");
const { ActionGeneratorCreator, GeneratorCreatorType } = require("./battle-system-types");

/**
 * @typedef {import("./action").Action} Action
 * @typedef {import("./battle-steps").BattleStep} BattleStep
 * @typedef {import("./action-generator").ActionGeneratorObject} ActionGeneratorObject
 * @typedef {import("./battle-system-types").ActiveActionGenerator} ActiveActionGenerator
 * @typedef {import("./battle-system-types").ActiveAction} ActiveAction
 */

class Effect extends ActionGeneratorCreator {
    /**
     * 
     * @param {BattleAgent} targetPlayer
     */
    constructor(targetPlayer) {
        super();
        this.targetPlayer = targetPlayer;
    }

    /**
     * @returns {GeneratorCreatorType}
     */
    get creatorType() {
        return GeneratorCreatorType.Effect;
    }

    getInputData() {
        return {};
    }

    /**
     * 
     * @param {BattleContext} battleContext 
     * @param {ActiveActionGenerator} actionGenerator 
     * @returns 
     */
    onActionGeneratorBegin(battleContext, actionGenerator) {
        return new ActionGenerator(this.actionGeneratorBeginEvent(battleContext, actionGenerator));
    }
    
    /**
     * 
     * @param {BattleContext} battleContext 
     * @param {ActiveActionGenerator} actionGenerator 
     * @returns 
     */
    onActionGeneratorEnd(battleContext, actionGenerator) {
        return new ActionGenerator(this.actionGeneratorEndEvent(battleContext, actionGenerator));
    }

    /**
     * 
     * @param {BattleContext} battleContext 
     * @param {ActiveAction} activeAction 
     * @returns 
     */
    onActionBegin(battleContext, activeAction) {
        return new ActionGenerator(this.actionBeginEvent(battleContext, activeAction));
    }

    /**
     * 
     * @param {BattleContext} battleContext
     * @param {ActiveAction} activeAction
     * @param {BattleStep[]} battleSteps
     * @returns 
     */
    onActionEnd(battleContext, activeAction, battleSteps) {
        return new ActionGenerator(this.actionEndEvent(battleContext, activeAction, battleSteps));
    }

    /**
     * Called when a new ActionGenerator is added to the stack in the battle system. This function generates the
     * actions that respond the event
     * @param {BattleContext} battleContext 
     * @param {ActiveActionGenerator} actionGenerator
     * @returns {ActionGeneratorObject}
     */
    *actionGeneratorBeginEvent(battleContext, actionGenerator) {

    }

    /**
     * Called when an ActionGenerator completed all of its actions and was removed from the battle system in
     * the battle system. This function generates the actions that respond the event
     * @param {BattleContext} battleContext 
     * @param {ActiveActionGenerator} actionGenerator 
     * @returns {ActionGeneratorObject}
     */
    *actionGeneratorEndEvent(battleContext, actionGenerator) {

    }

    /**
     * Called when a new Action is added to the stack in the battle system. This function generates the
     * actions that respond the event
     * @param {BattleContext} battleContext 
     * @param {ActiveAction} activeAction 
     * @returns {ActionGeneratorObject}
     */
    *actionBeginEvent(battleContext, activeAction) {

    }

    /**
     * Called when an Action has was removed from the battle system in This function generates the
     * actions that respond the event
     * @param {BattleContext} battleContext 
     * @param {ActiveAction} activeAction 
     * @param {BattleStep[]} battleSteps 
     * @returns {ActionGeneratorObject}
     */
    *actionEndEvent(battleContext, activeAction, battleSteps) {

    }
  
};

module.exports = {Effect};