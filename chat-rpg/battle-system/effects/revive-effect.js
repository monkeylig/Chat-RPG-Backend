/**
 * @import {ActiveAction} from "../battle-system-types"
 * @import {BattleStep, DamageStep} from "../battle-steps"
 * @import {ActionGeneratorObject} from "../action-generator"
 */

const { BattleAgent } = require("../../datastore-objects/battle-agent");
const { BattleContext } = require("../battle-context");
const { Effect } = require("../effect");

class ReviveEffect extends Effect {

    /**
     * @typedef {Object} ReviveEffectData
     * @property {number} healthRecoverPercent
     * 
     * @param {BattleAgent} targetPlayer 
     * @param {ReviveEffectData} [inputData] 
     */
    constructor(targetPlayer, inputData) {
        super(targetPlayer, inputData);
        this.name = "Revive";
        this.persistentId = "revive";
        this.unique = true;
        if(!inputData) {
            this._inputData = {
                healthRecoverPercent: 0.5
            };
        }
    }

    /**
     * @override
     * @param {BattleContext} battleContext 
     * @param {ActiveAction} activeAction 
     * @param {BattleStep[]} battleSteps 
     * @returns {ActionGeneratorObject}
     */
    *actionEndEvent(battleContext, activeAction, battleSteps) {
        if (!this.targetPlayer.isDefeated()) {
            return;
        }
        for(const activeAction of battleContext.getActionStack()) {
            if (activeAction.creator === this) {
                return;
            }
        }
        const inputData = /**@type {ReviveEffectData} */ (yield true);

        yield {
            playerAction: {
                targetPlayer: this.targetPlayer,
                revive: inputData.healthRecoverPercent
            },
            battleContextAction: {
                battleContext: battleContext,
                removeEffect: this
            }
        };
    }
}

module.exports = {ReviveEffect, effect: ReviveEffect};