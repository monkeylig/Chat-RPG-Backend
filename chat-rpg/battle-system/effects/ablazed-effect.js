/**
 * @import {ActiveAction} from "../battle-system-types"
 * @import {ActionGeneratorObject} from "../action-generator"
 * @import {BattleStep} from "../battle-steps"
 * @import {BattleContext} from "../battle-context"
 */

const { BattleAgent } = require("../../datastore-objects/battle-agent");
const { PlayerActionType, ElementsEnum } = require("../action");
const { Effect } = require("../effect");
const { matchPlayerAction } = require("../utility");

class AblazedEffect extends Effect {

    /**
     * @typedef {Object} AblazedEffectData
     * @property {number} trueDamage
     * @property {number} roundsLeft
     * 
     * @param {BattleAgent} targetAgent 
     * @param {AblazedEffectData} inputData 
     */
    constructor(targetAgent, inputData) {
        super(targetAgent, inputData);

        this.name = "Ablazed";
        this.unique = true;

        if (!this._inputData.trueDamage) {
            this._inputData.trueDamage = 10;
        }

        if (this._inputData.roundsLeft === undefined) {
            this._inputData.roundsLeft = 3;
        }
    }

    getInputData() {
        return /**@type {AblazedEffectData}*/(this._inputData);
    }
    /**
     * Called at the end of a round of battle round
     * @param {BattleContext} battleContext 
     * @returns {ActionGeneratorObject}
     */
    *battleRoundEndEvent(battleContext) {
        const inputData = /**@type {AblazedEffectData}*/(yield true);

        yield* super.effectLifetimeActions(inputData);

        if (this.isEffectExpired(inputData)) {
            return;
        }

        if (this.targetPlayer.isDefeated()) {
            return;
        }

        yield {
            playerAction: {
                targetPlayer: this.targetPlayer,
                trueDamage: inputData.trueDamage,
                type: PlayerActionType.Natural
            },
            infoAction: {
                description: `${this.targetPlayer.getData().name} was burned by the flames.`,
                action: 'ablazeDamage'
            }
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
        if (this.targetPlayer.isDefeated()) {
            return;
        }
        if (this.isEffectStartEvent(activeAction, battleSteps)) {
            yield true;
            yield {
                infoAction: {
                    description: `${this.targetPlayer.getData().name} is now ${this.name}!`,
                    action: 'ablazed'
                }
            };
        }

        if (matchPlayerAction(activeAction.action, {elements: [ElementsEnum.Water]}) && battleSteps.length > 0) {
            yield true;
            yield {
                battleContextAction: {
                    removeEffect: this
                }                
            };
        }
    }
}

module.exports = {AblazedEffect};
