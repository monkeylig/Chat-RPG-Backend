/**
 * @import {BattleContext} from "../battle-context"
 * @import {ActiveAction} from "../battle-system-types"
 * @import {BattleStep} from "../battle-steps"
 * @import {ActionGeneratorObject} from "../action-generator"
 * @import {BattleAgent} from "../../datastore-objects/battle-agent"
 * @import {BattleMove} from "../battle-move"
 */

const { chance } = require("../../utility");
const { Effect } = require("../effect");

class FrozenEffect extends Effect {
    /**
     * @typedef {Object} FrozenEffectData
     * @property {number} attackChance
     * @property {number} roundsLeft
     * 
     * @param {BattleAgent} targetAgent 
     * @param {FrozenEffectData} inputData 
     */
    constructor(targetAgent, inputData) {
        super(targetAgent, inputData);

        this.name = "Frozen";
        this.unique = true;

        if (!this._inputData.attackChance) {
            this._inputData.attackChance = 1;
        }

        if (this._inputData.roundsLeft === undefined) {
            this._inputData.roundsLeft = 1;
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
                    description: `${this.targetPlayer.getData().name} is now ${this.name}!`,
                    action: 'frozen'
                }
            };
            return;
        }

        const infoAction = activeAction.action.infoAction;
        if (infoAction && (infoAction.action === 'strike' ||
            infoAction.action === 'strikeAbility' ||
            infoAction.action === 'ability' ||
            infoAction.action === 'item') &&
            /**@type {BattleMove}*/(activeAction.creator).owner === this.targetPlayer
        ) {
            const inputData = /**@type {FrozenEffectData}*/(yield true);
            if (!chance(inputData.attackChance)) {
                return;
            }

            yield {
                battleContextAction: {
                    removeActionGenerator: activeAction.generator,
                    targetId: this.targetPlayer.getData().id,
                },
                infoAction: {
                    description: `${this.targetPlayer.getData().name} is frozen and can't move.`,
                    action: 'freeze'
                }
            };
        }

        if (this.isEffectEndEvent(activeAction, battleSteps)) {
            yield true;
            yield {
                infoAction: {
                    description: `${this.targetPlayer.getData().name} is no longer ${this.name}.`,
                    action: 'frozen-recovery',
                    targetAgentId: this.targetPlayer.getData().id
                }
            };
        }
    }
}

module.exports = {FrozenEffect};
