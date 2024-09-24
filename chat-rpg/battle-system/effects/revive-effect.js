/**
 * @import {ActiveAction} from "../battle-system-types"
 * @import {BattleStep, DamageStep} from "../battle-steps"
 * @import {ActionGeneratorObject} from "../action-generator"
 * @import {BattleContext} from "../battle-context"
 */

const { BattleAgent } = require("../../datastore-objects/battle-agent");
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
        if (!this._inputData.healthRecoverPercent) {
            this._inputData.healthRecoverPercent = 0.5;
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
        if (this.isEffectStartEvent(activeAction, battleSteps)) {
            yield true;
            yield {
                infoAction: {
                    description: `${this.targetPlayer.getData().name} is ready to revive!`,
                    action: 'reviveReady'
                }
            };
        }

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
            }
        };
        
        yield {
            battleContextAction: {
                removeEffect: this
            }
        };
    }
}

module.exports = {ReviveEffect, effect: ReviveEffect};