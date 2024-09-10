/**
 * @import {BattleAgent} from "../../datastore-objects/battle-agent"
 * @import {BattleContext} from "../battle-context"
 * @import {ActionGeneratorObject} from "../action-generator"
 * @import {ActiveAction, ActiveActionGenerator} from "../battle-system-types"
 * @import {BattleStep} from "../battle-steps"
 * @import {AbilityData} from "../../datastore-objects/ability"
 * @import {BattleMove} from "../battle-move"
 */

const { Effect } = require("../effect");
const { isBattleMove } = require("../utility");
const { GeneratorCreatorType } = require("../battle-system-types");

class MultiTriggerEffect extends Effect {
    /**
     * @typedef {Object} MultiTriggerEffectData
     * @property {number} triggerTimes 
     * 
     * @param {BattleAgent} targetPlayer 
     * @param {MultiTriggerEffectData} inputData 
     */
    constructor(targetPlayer, inputData) {
        super(targetPlayer, inputData);

        this.unique = false;
        this.name = "Multi Trigger Attack";

        if (!this._inputData.triggerTimes) {
            this._inputData.triggerTimes = 1;
        }
        this.originGen;
    }

    getInputData() {
        return /**@type {MultiTriggerEffectData}*/(this._inputData);
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
        if (this.isEffectStartEvent(activeAction, battleSteps)) {
            this.originGen = activeAction.generator;
        }
    }

    /**
     * Called when an ActionGenerator completed all of its actions and was removed from the battle system in
     * the battle system. This function generates the actions that respond the event
     * @param {BattleContext} battleContext 
     * @param {ActiveActionGenerator} actionGenerator 
     * @returns {ActionGeneratorObject}
     */
    *actionGeneratorEndEvent(battleContext, actionGenerator) {
        if (!isBattleMove(actionGenerator.creator) ||
        actionGenerator.creator.creatorType === GeneratorCreatorType.Item ||
        actionGenerator.generator === this.originGen) {
            return;
        }

        const battleMove = /**@type {BattleMove}*/(actionGenerator.creator)

        if (battleMove.owner !== this.targetPlayer) {
            return;
        }

        const inputData = /**@type {MultiTriggerEffectData}*/(yield true);
        
        if (inputData.triggerTimes > 0) {
            const abilityData = /**@type {AbilityData}*/(actionGenerator.generator.inputData);
            yield {
                battleContextAction: {
                    triggerAbility: {
                        ability: abilityData,
                        user: this.targetPlayer
                    }
                }
            };

            this.getInputData().triggerTimes -= 1;
        }
        else {
            yield this.endEffectAction();
        }
    }
}

module.exports = {MultiTriggerEffect};
