/**
 * @import {ActiveActionGenerator, ActiveAction} from "../battle-system-types"
 * @import {ActionGenerator, ActionGeneratorObject} from "../action-generator"
 * @import {BattleStep} from "../battle-steps"
 * @import {Action} from "../action"
 * @import {BattleMove} from "../battle-move"
 * @import {BattleContext} from "../battle-context"
 */

const { BattleAgent } = require("../../datastore-objects/battle-agent");
const { PlayerActionType } = require("../action");
const { Effect } = require("../effect");
const { GeneratorCreatorType } = require("../battle-system-types");

class EmpowermentEffect extends Effect {
    /**@type {ActionGenerator | undefined} */
    #targetGenerator;

    /**
     * @typedef {Object} EmpowermentEffectData
     * @property {number} damageIncrease
     * @property {PlayerActionType} type
     * 
     * @param {BattleAgent} targetAgent 
     * @param {EmpowermentEffectData} inputData 
     */
    constructor(targetAgent, inputData) {
        super(targetAgent, inputData);
        this.name = "Empowerment";
        this.unique = false;
        if (!this._inputData.damageIncrease) {
            this._inputData.damageIncrease = 0;
        }

        if (!this._inputData.type) {
            this._inputData.type = PlayerActionType.Physical;
        }
        //Private data
        this.#targetGenerator;
    }

    /**
     * 
     * @param {ActiveActionGenerator} actionGenerator 
     * @returns {boolean}
     */
    #isTargetActionGenerator(actionGenerator) {
        if ((actionGenerator.creator.creatorType !== GeneratorCreatorType.Strike &&
            actionGenerator.creator.creatorType !== GeneratorCreatorType.StrikeAbility &&
            actionGenerator.creator.creatorType !== GeneratorCreatorType.Ability) ||
            !actionGenerator.generator.inputData.baseDamage
        ) {
            return false;
        }

        const battleMove = /**@type {BattleMove} */(actionGenerator.creator);

        if (battleMove.owner !== this.targetPlayer) {
            return false;
        }

        return true;
    }

    /**
     * Called when a new ActionGenerator is added to the stack in the battle system. This function generates the
     * actions that respond the event
     * @param {BattleContext} battleContext 
     * @param {ActiveActionGenerator} actionGenerator
     * @returns {ActionGeneratorObject}
     */
    *actionGeneratorBeginEvent(battleContext, actionGenerator) {
        if (!this.#isTargetActionGenerator(actionGenerator)) {
            return;
        }
        
        const inputData = /**@type {EmpowermentEffectData} */(yield true);

        if (actionGenerator.generator.inputData.type !== inputData.type) {
            return;
        }

        this.#targetGenerator = actionGenerator.generator;
    }

    /**
     * Called when an Action has was removed from the battle system in This function generates the
     * actions that respond the event
     * @param {BattleContext} battleContext 
     * @param {ActiveAction} activeAction 
     * @returns {ActionGeneratorObject}
     */
    *actionBeginEvent(battleContext, activeAction) {
        if (activeAction.action.playerAction?.srcPlayer !== this.targetPlayer ||
            !activeAction.action.playerAction.baseDamage ||
            !this.#targetGenerator) {
            return;
        }

        const inputData = /**@type {EmpowermentEffectData} */(yield true);

        if (activeAction.generator.inputData.type !== inputData.type) {
            return;
        }

        /**@type {(data: Action) => void} */
        const modFunction = (data) => {
            if (!data.playerAction || !data.playerAction.baseDamage) {
                return;
            }

            data.playerAction.baseDamage +=  inputData.damageIncrease;
        }

        yield {
            actionModAction: {
                targetAction: activeAction.action,
                modFunction,
                action: 'buff',
                targetId: this.targetPlayer.getData().id
            }
        };
    }

    /**
     * Called when an ActionGenerator completed all of its actions and was removed from the battle system in
     * the battle system. This function generates the actions that respond the event
     * @param {BattleContext} battleContext 
     * @param {ActiveActionGenerator} actionGenerator 
     * @returns {ActionGeneratorObject}
     */
    *actionGeneratorEndEvent(battleContext, actionGenerator) {
        if (this.#targetGenerator !== actionGenerator.generator) {
            return;
        }
        
        const inputData = /**@type {EmpowermentEffectData} */(yield true);

        if (actionGenerator.generator.inputData.type !== inputData.type) {
            return;
        }

        yield {
            battleContextAction: {
                removeEffect: this
            }
        };
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
        if (!this.isEffectStartEvent(activeAction, battleSteps)) {
            return;
        }

        const inputData = /**@type {EmpowermentEffectData} */(yield true);

        yield {
            infoAction: {
                description: `${this.targetPlayer.getData().name} gained ${inputData.damageIncrease} ${inputData.type} empowerment!`,
                action: 'empowerment',
            }
        };
    }
}

module.exports = {EmpowermentEffect, effect: EmpowermentEffect};