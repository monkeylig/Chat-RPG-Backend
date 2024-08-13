/**
 * @import {BattleAgent} from "../../datastore-objects/battle-agent"
 * @import {BattleContext} from "../battle-context"
 * @import {ActiveAction, ActiveActionGenerator} from "../battle-system-types"
 * @import {BattleStep} from "../battle-steps"
 * @import {ActionGeneratorObject} from "../action-generator"
 * @import {AbilityData} from "../../datastore-objects/ability"
 */

const { Effect } = require("../effect");
const { GeneratorCreatorType } = require("../battle-system-types");
const { BattleMove } = require("../battle-move");
const { matchAttackAction } = require("../utility");

class ImbueEffect extends Effect {
    /**
     * @typedef {Object} ImbueEffectData
     * @property {string} element
     * @property {number} roundsLeft
     * 
     * @param {BattleAgent} targetAgent 
     * @param {ImbueEffectData} inputData 
     */
    constructor(targetAgent, inputData) {
        super(targetAgent, inputData);

        this.name = "ImbuedWeapon";
        this.unique = false;

        if (!this._inputData.roundsLeft) {
            this._inputData.roundsLeft = 1;
        }
    }

    getInputData() {
        return /**@type {ImbueEffectData}*/(this._inputData);
    }

    /**
     * Called when a new Action is added to the stack in the battle system. This function generates the
     * actions that respond the event
     * @param {BattleContext} battleContext 
     * @param {ActiveAction} activeAction 
     * @returns {ActionGeneratorObject}
     */
    *actionBeginEvent(battleContext, activeAction) {
        if (!matchAttackAction(activeAction.action, {style: this.targetPlayer.getData().weapon.style, srcAgent: this.targetPlayer})) {
            return;
        }

        const inputData = /**@type {ImbueEffectData}*/(yield true);

        yield {
            actionModAction: {
                targetAction: activeAction.action,
                action: 'buff',
                targetId: this.targetPlayer.getData().id,
                /**
                 * 
                 * @param {AbilityData} genData 
                 */
                modFunction(genData) {
                    if (!genData.elements) {
                        genData.elements = [];
                    }
                    genData.elements.push(inputData.element);
                }
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
        if (this.isEffectStartEvent(activeAction, battleSteps)) {
            const inputData = /**@type {ImbueEffectData}*/(yield true);
            yield {
                infoAction: {
                    description: `${this.targetPlayer.getData().name}'s weapon is now imbued with ${inputData.element}!`,
                    action: 'imbued'
                }
            };
        }
    }

    /**
     * Called at the end of a round of battle round
     * @param {BattleContext} battleContext 
     * @returns {ActionGeneratorObject}
     */
    *battleRoundEndEvent(battleContext) {
        const inputData = /**@type {ImbueEffectData}*/(yield true);

        if (inputData.roundsLeft <= 0) {
            yield {
                battleContextAction: {
                    removeEffect: this
                }                
            };
        }

        this.getInputData().roundsLeft -= 1;
    }
}

module.exports = {ImbueEffect};
