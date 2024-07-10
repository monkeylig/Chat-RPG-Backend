/**
 * @import {BattleStep} from "./battle-steps"
 * @import {ActionGeneratorObject} from "./action-generator"
 * @import {ActiveActionGenerator, ActiveAction} from "./battle-system-types"
 * @import {BattleContext} from "./battle-context"
 */

/**
 * @typedef {Object} EffectData
 * @property {string} targetId
 * @property {string} className
 * @property {Object} inputData
 * @property {string} persistentId
 */

const { BattleAgent } = require("../datastore-objects/battle-agent");
const { ActionGenerator } = require("./action-generator");
const { ActionGeneratorCreator, GeneratorCreatorType } = require("./battle-system-types");

class Effect extends ActionGeneratorCreator {
    /**
     * 
     * @param {BattleAgent} targetPlayer
     * @param {Object} [inputData]
     */
    constructor(targetPlayer, inputData) {
        super();
        /** @type {BattleAgent} */
        this.targetPlayer = targetPlayer;
        /** @type {string} */
        this.persistentId = '';
        /** @type {boolean} */
        this.unique = false;
        /** @type {string} */
        this.name = 'Battle Effect';

        this._inputData = inputData ? inputData : {};
    }

    get className() {
        return this.constructor.name;
    }
    /**
     * @returns {GeneratorCreatorType}
     */
    get creatorType() {
        return GeneratorCreatorType.Effect;
    }

    /**
     * 
     * @returns {EffectData}
     */
    getData() {
        return {
            targetId: this.targetPlayer.getData().id,
            className: this.className,
            inputData: this.getInputData(),
            persistentId: this.persistentId
        };
    }

    getInputData() {
        return this._inputData;
    }

    /**
     * 
     * @param {BattleContext} battleContext 
     * @param {ActiveActionGenerator} actionGenerator 
     * @returns 
     */
    onActionGeneratorBegin(battleContext, actionGenerator) {
        const newGenerator = new ActionGenerator(this.actionGeneratorBeginEvent(battleContext, actionGenerator));
        newGenerator.inputData = this.getInputData();
        return newGenerator;
    }
    
    /**
     * 
     * @param {BattleContext} battleContext 
     * @param {ActiveActionGenerator} actionGenerator 
     * @returns 
     */
    onActionGeneratorEnd(battleContext, actionGenerator) {
        const newGenerator = new ActionGenerator(this.actionGeneratorEndEvent(battleContext, actionGenerator));
        newGenerator.inputData = this.getInputData();
        return newGenerator;
    }

    /**
     * 
     * @param {BattleContext} battleContext 
     * @param {ActiveAction} activeAction 
     * @returns 
     */
    onActionBegin(battleContext, activeAction) {
        const newGenerator = new ActionGenerator(this.actionBeginEvent(battleContext, activeAction));
        newGenerator.inputData = this.getInputData();
        return newGenerator;
    }

    /**
     * 
     * @param {BattleContext} battleContext
     * @param {ActiveAction} activeAction
     * @param {BattleStep[]} battleSteps
     * @returns 
     */
    onActionEnd(battleContext, activeAction, battleSteps) {
        const newGenerator = new ActionGenerator(this.actionEndEvent(battleContext, activeAction, battleSteps));
        newGenerator.inputData = this.getInputData();
        return newGenerator;
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