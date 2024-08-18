/**
 * @import {AbilityData} from "../../datastore-objects/ability"
 * @import {BattleAgent} from "../../datastore-objects/battle-agent"
 * @import {BattleContext} from "../battle-context"
 * @import {ActiveAction} from "../battle-system-types"
 * @import {BattleStep} from "../battle-steps"
 * @import {ActionGeneratorObject} from "../action-generator"
 * @import {BattleMove} from "../battle-move"
 */

const Ability = require("../../datastore-objects/ability");
const { Effect } = require("../effect");

class CounterEffect extends Effect {
    /**
     * @typedef {Object} CounterEffectData
     * @property {AbilityData} ability
     * @property {{
     * attackType: string
     * }} filter
     * 
     * @param {BattleAgent} targetAgent 
     * @param {CounterEffectData} inputData 
     */
    constructor(targetAgent, inputData) {
        super(targetAgent, inputData);

        this.name = "Counter";
        this.unique = true;

        if (!this._inputData.ability) {
            this._inputData.ability = new Ability();
        }

        if (!this._inputData.filter) {
            this._inputData.filter = {
                attackType: ''
            };
        }
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
                    description: `${this.targetPlayer.getData().name} is ready to defend.`,
                    action: 'counterReady'
                }
            };
            return;
        }

        const infoAction = activeAction.action.infoAction;
        if (infoAction && (infoAction.action === 'strike' ||
            infoAction.action === 'strikeAbility' ||
            infoAction.action === 'ability' ||
            infoAction.action === 'item')
        ) {
            const attacker = /**@type {BattleMove}*/(activeAction.creator).owner
            if (this.targetPlayer === attacker) {
                return;
            }
            const inputData = /**@type {CounterEffectData}*/(yield true);
            if (!activeAction.generator.inputData.baseDamage) {
                return;
            }
            if (inputData.filter.attackType === infoAction.action) {
                yield {
                    battleContextAction: {
                        removeActionGenerator: activeAction.generator,
                        targetId: attacker.getData().id,
                        triggerAbility: {
                            ability: inputData.ability,
                            user: this.targetPlayer
                        }
                    },
                    infoAction: {
                        description: `But it was countered!`,
                        action: 'counter'
                    }
                }
            }
        }
    }
    /**
     * Called at the end of a round of battle round
     * @param {BattleContext} battleContext 
     * @returns {ActionGeneratorObject}
     */
    *battleRoundEndEvent(battleContext) {
        const inputData = /**@type {CounterEffectData}*/(yield true);
        yield {
            battleContextAction: {
                removeEffect: this
            }                
        };
    }
}

module.exports = {CounterEffect};
