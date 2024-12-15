/**
 * @import {BattleContext} from "../battle-context"
 * @import {ActiveAction} from "../battle-system-types"
 * @import {BattleStep} from "../battle-steps"
 * @import {ActionGeneratorObject} from "../action-generator"
 * @import {BattleAgent} from "../../datastore-objects/battle-agent"
 * @import {Action} from "../action"
 */

const { ElementsEnum } = require("../action");
const { Effect } = require("../effect");
const { matchPlayerAction, matchAttackAction } = require("../utility");

class DrenchedEffect extends Effect {
    /**
     * @typedef {Object} DrenchedEffectData
     * @property {number} trueDamage
     * @property {number} roundsLeft
     * 
     * @param {BattleAgent} targetAgent 
     * @param {DrenchedEffectData} inputData 
     */
    constructor(targetAgent, inputData) {
        super(targetAgent, inputData);

        this.name = "Drenched";
        this.unique = true;

        if (!this._inputData.trueDamage) {
            this._inputData.trueDamage = 5;
        }

        if (this._inputData.roundsLeft === undefined) {
            this._inputData.roundsLeft = 5;
        }
    }

    getInputData() {
        return /**@type {DrenchedEffectData}*/(this._inputData);
    }

    /**
     * Called when a new Action is added to the stack in the battle system. This function generates the
     * actions that respond the event
     * @param {BattleContext} battleContext 
     * @param {ActiveAction} activeAction 
     * @returns {ActionGeneratorObject}
     */
    *actionBeginEvent(battleContext, activeAction) {
        if (!matchAttackAction(activeAction.action, {elements: [ElementsEnum.Lightning], targetAgent: this.targetPlayer})) {
            return;
        }

        const inpuData = /**@type {DrenchedEffectData}*/(yield true);

        yield {
            actionModAction: {
                targetAction: activeAction.action,
                action: 'debuff',
                targetId: this.targetPlayer.getData().id,
                /**
                 * @param {Action} action 
                 */
                modFunction(action) {
                    if (!action.playerAction) {
                        return;
                    }

                    if (matchAttackAction(action)) {
                        if (!action.playerAction.trueDamage) {
                            action.playerAction.trueDamage = 0;
                        }
                        action.playerAction.trueDamage += inpuData.trueDamage;
                    }
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
            yield true;
            yield {
                infoAction: {
                    description: `${this.targetPlayer.getData().name} is now ${this.name}!`,
                    action: 'drenched'
                }
            };
            return;
        }

        if (matchPlayerAction(activeAction.action, {elements: [ElementsEnum.Fire], targetAgent: this.targetPlayer})) {
            yield true;
            yield {
                battleContextAction: {
                    removeEffect: this
                }                
            };
            return;
        }

        if (matchAttackAction(activeAction.action, {elements: [ElementsEnum.Ice], targetAgent: this.targetPlayer})) {
            yield true;
            yield {
                battleContextAction: {
                    removeEffect: this,
                    addEffect: {
                        className: 'FrozenEffect',
                        targetId: this.targetPlayer.getData().id,
                        inputData: {}
                    }
                }
            };
            return;
        }

        if (this.isEffectEndEvent(activeAction, battleSteps)) {
            yield true;
            yield {
                infoAction: {
                    description: `${this.targetPlayer.getData().name} is no longer ${this.name}.`,
                    action: 'drenched-recovery',
                    targetAgentId: this.targetPlayer.getData().id
                }
            };
        }
    }
}

module.exports = {DrenchedEffect};
