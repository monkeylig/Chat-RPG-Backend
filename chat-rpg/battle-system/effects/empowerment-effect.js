/**
 * @import {ActiveActionGenerator, ActiveAction} from "../battle-system-types"
 * @import {ActionGenerator, ActionGeneratorObject} from "../action-generator"
 * @import {BattleStep} from "../battle-steps"
 * @import {Action} from "../action"
 * @import {BattleContext} from "../battle-context"
 */

const { BattleAgent } = require("../../datastore-objects/battle-agent");
const { PlayerActionType } = require("../action");
const { Effect } = require("../effect");
const { matchAttackAction } = require("../utility");

class EmpowermentEffect extends Effect {
    /**@type {boolean} */
    #isActivated;

    /**
     * @typedef {Object} EmpowermentEffectData
     * @property {number} damageIncrease
     * @property {PlayerActionType} type
     * 
     * @param {BattleAgent} targetAgent 
     * @param {EmpowermentEffectData} inputData 
     */
    constructor(targetAgent, inputData) {
        super(targetAgent, inputData);
        this.name = "Empowerment";
        this.unique = false;
        if (!this._inputData.damageIncrease) {
            this._inputData.damageIncrease = 0;
        }

        if (!this._inputData.type) {
            this._inputData.type = PlayerActionType.Physical;
        }

        //Private data
        this.#isActivated = false;
    }

    /**
     * Called when an Action has was removed from the battle system in This function generates the
     * actions that respond the event
     * @param {BattleContext} battleContext 
     * @param {ActiveAction} activeAction 
     * @returns {ActionGeneratorObject}
     */
    *actionBeginEvent(battleContext, activeAction) {
        if (!matchAttackAction(activeAction.action, {srcAgent: this.targetPlayer})) {
            return;
        }

        const inputData = /**@type {EmpowermentEffectData} */(yield true);

        if (!matchAttackAction(activeAction.action, {type: inputData.type})) {
            return;
        }

        this.#isActivated = true;
        /**@type {(data: Action) => void} */
        const modFunction = (data) => {
            if (!data.playerAction || !data.playerAction.baseDamage) {
                return;
            }

            data.playerAction.baseDamage +=  inputData.damageIncrease;
        }

        yield {
            actionModAction: {
                targetAction: activeAction.action,
                modFunction,
                action: 'buff',
                targetId: this.targetPlayer.getData().id
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
        if (!this.isEffectStartEvent(activeAction, battleSteps)) {
            return;
        }

        const inputData = /**@type {EmpowermentEffectData} */(yield true);

        yield {
            infoAction: {
                description: `${this.targetPlayer.getData().name} gained ${inputData.damageIncrease} ${inputData.type} empowerment!`,
                action: 'empowerment',
            }
        };
    }

    /**
     * Called at the end of a round of battle round
     * @param {BattleContext} battleContext 
     * @returns {ActionGeneratorObject}
     */
    *battleRoundEndEvent(battleContext) {
        if (!this.#isActivated) {
            return;
        }

        yield true;

        yield this.endEffectAction();
    }
}

module.exports = {EmpowermentEffect, effect: EmpowermentEffect};