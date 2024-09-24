/**
 * @import {BattleAgent} from "../../datastore-objects/battle-agent"
 * @import {BattleContext} from "../battle-context"
 * @import {BattleStep} from "../battle-steps"
 * @import {ActionGeneratorObject} from "../action-generator"
 * @import {ActiveAction} from "../battle-system-types"
 */

const { ElementsEnum, PlayerActionStyle, PlayerActionType } = require("../action");
const { Effect } = require("../effect");
const { findBattleStep, findElement } = require("../utility");

class SurgedEffect extends Effect{
    /**
     * @typedef {Object} SurgedEffectData
     * @property {number} trueDamage
     * @property {number} roundsLeft
     *  
     * @param {BattleAgent} targetAgent 
     * @param {SurgedEffectData} inputData 
     */
    constructor(targetAgent, inputData) {
        super(targetAgent, inputData);

        this.name = "Surged";
        this.unique = true;

        if (!this._inputData.trueDamage) {
            this._inputData.trueDamage = 30;
        }

        if (this._inputData.roundsLeft === undefined) {
            this._inputData.roundsLeft = 2;
        }
    }

    getInputData() {
        return /**@type {SurgedEffectData}*/(this._inputData);
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
        const playerAction = activeAction.action.playerAction;
        if (this.isEffectStartEvent(activeAction, battleSteps)) {
            yield true;

            yield {
                infoAction: {
                    description: `${this.targetPlayer.getData().name} is now ${this.name}!`,
                    action: 'surged'
                }
            };
        }
        else if (playerAction && playerAction.baseDamage && playerAction.baseDamage > 0 &&
            findBattleStep('damage', battleSteps) && findElement(ElementsEnum.Lightning, playerAction.elements)
        ) {
            const inputData = /**@type {SurgedEffectData}*/(yield true);
            yield {
                playerAction: {
                    targetPlayer: this.targetPlayer,
                    trueDamage: inputData.trueDamage,
                    type: PlayerActionType.Natural
                }
            };

            yield {
                infoAction: {
                    description: `${this.targetPlayer.getData().name} was discarged.`,
                    action: 'surgeDamage'
                }
            };
        }
    }
};

module.exports = {SurgedEffect, effect: SurgedEffect};
