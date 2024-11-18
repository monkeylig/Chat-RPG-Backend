/**
 * @import {BattleAgent} from "../../datastore-objects/battle-agent"
 * @import {BattleContext} from "../battle-context"
 * @import {ActiveAction} from "../battle-system-types"
 * @import {BattleStep} from "../battle-steps"
 * @import {ActionGeneratorObject} from "../action-generator"
 * @import {Action} from "../action"
 */

const { Effect } = require("../effect");
const { matchAttackAction } = require("../utility");

/**
 * @typedef {Object} ImbueEffectData
 * @property {string} element
 * @property {number} roundsLeft 
 */

class ImbueEffect extends Effect {
    /**
     * 
     * @param {BattleAgent} targetAgent 
     * @param {ImbueEffectData} inputData
     */
    constructor(targetAgent, inputData) {
        super(targetAgent, inputData);

        this.name = "ImbuedWeapon";
        this.unique = false;

        if (this._inputData.roundsLeft === undefined) {
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
                 * @param {Action} actionData 
                 */
                modFunction(actionData) {
                    if (!actionData.playerAction) {
                        return;
                    }
                    if (actionData.playerAction.elements === undefined) {
                        actionData.playerAction.elements = [];
                    }
                    actionData.playerAction.elements.push(inputData.element);
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
}

module.exports = {ImbueEffect};
