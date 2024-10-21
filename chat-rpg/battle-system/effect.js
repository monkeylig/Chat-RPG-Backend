/**
 * @import {AddEffectStep, BattleStep, RemoveEffectStep} from "./battle-steps"
 * @import {ActionGeneratorObject} from "./action-generator"
 * @import {ActiveActionGenerator, ActiveAction} from "./battle-system-types"
 * @import {BattleContext} from "./battle-context"
 * @import {Action} from "./action"
 */

/**
 * @typedef {Object} EffectData
 * @property {string} targetId
 * @property {string} className
 * @property {Object} inputData
 * @property {string} [persistentId]
 */

const { BattleAgent } = require("../datastore-objects/battle-agent");
const { ActionGenerator } = require("./action-generator");
const { ActionGeneratorCreator, GeneratorCreatorType } = require("./battle-system-types");
const { findBattleStep } = require("./utility");

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
        /** @type {string|undefined} */
        this.persistentId;
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
     * Called at the begining of a round of battle round
     * @param {BattleContext} battleContext 
     * @returns {ActionGenerator}
     */
    onBattleRoundBegin(battleContext) {
        const newGenerator = new ActionGenerator(this.battleRoundBeginEvent(battleContext));
        newGenerator.inputData = this.getInputData();
        return newGenerator;
    }

    /**
     * Called at the end of a round of battle round
     * @param {BattleContext} battleContext 
     * @returns {ActionGenerator}
     */
    onBattleRoundEnd(battleContext) {
        const newGenerator = new ActionGenerator(this.battleRoundEndEvent(battleContext));
        newGenerator.inputData = this.getInputData();

        const inputData = this.getInputData();
        if (inputData.roundsLeft) {
            inputData.roundsLeft -= 1;
        }

        return newGenerator;
    }

    /**
     * 
     * @param {BattleContext} battleContext 
     * @param {ActiveActionGenerator} actionGenerator 
     * @returns {ActionGenerator}
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
     * Called at the begining of a round of battle round
     * @param {BattleContext} battleContext 
     * @returns {ActionGeneratorObject}
     */
    *battleRoundBeginEvent(battleContext) {

    }

    /**
     * Called at the end of a round of battle round
     * @param {BattleContext} battleContext 
     * @returns {ActionGeneratorObject}
     */
    *battleRoundEndEvent(battleContext) {
        if (this.getInputData().roundsLeft !== undefined) {
            const inputData = yield true;
            yield* this.effectLifetimeActions(inputData);
        }
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
  
    /**
     * 
     * @param {ActiveAction} activeAction 
     * @param {BattleStep[]} battleSteps 
     * @returns {boolean}
     */
    isEffectStartEvent(activeAction, battleSteps) {
        const effectStep = /**@type {AddEffectStep|undefined}*/(findBattleStep('addEffect', battleSteps));
        if (effectStep && effectStep.successful && effectStep.effect.inputData === this.getInputData()) {
            return true;
        }

        return false;
    }

    /**
     * 
     * @param {ActiveAction} activeAction 
     * @param {BattleStep[]} battleSteps 
     * @returns {boolean}
     */
    isEffectEndEvent(activeAction, battleSteps) {
        const effectStep = /**@type {RemoveEffectStep|undefined}*/(findBattleStep('removeEffect', battleSteps));
        if (effectStep && effectStep.successful && effectStep.effect.inputData === this.getInputData()) {
            return true;
        }

        return false;
    }

    /**
     * @param {{roundsLeft?: number}} inputData 
     * @returns {boolean}
     */
    isEffectExpired(inputData) {
        return inputData.roundsLeft !== undefined && inputData.roundsLeft <= 0;
    }

    /**
     * @returns {Action}
     */
    endEffectAction() {
        return {
            battleContextAction: {
                removeEffect: this
            }                
        };
    }

    /**
     * @param {{roundsLeft: number}} inputData 
     * @returns {ActionGeneratorObject}
     */
    *effectLifetimeActions(inputData) {
        if (this.isEffectExpired(inputData)) {
            yield this.endEffectAction();
        }
    }
};

module.exports = {Effect};