/**
 * @import {BattleAgent} from "../../datastore-objects/battle-agent"
 * @import {ActiveAction} from "../battle-system-types"
 * @import {ActionGeneratorObject} from "../action-generator"
 * @import {BattleContext} from "../battle-context"
 */

const { Effect } = require("../effect");
const { matchAttackAction } = require("../utility");

class ElementalBoost extends Effect {
    /**
     * @typedef {Object} ElementalBoostData
     * @property {string} element
     * @property {number} damageBoost
     * @property {number} roundsLeft
     * 
     * @param {BattleAgent} targetAgent 
     * @param {ElementalBoostData} inputData 
     */
    constructor(targetAgent, inputData) {
        super(targetAgent, inputData);
        this.name = 'Elemental Boost';
        this.unique = false;

        if (!this._inputData.element) {
            this._inputData.element = '';
        }

        if (!this._inputData.damageBoost) {
            this._inputData.damageBoost = 0;
        }

        if (this._inputData.roundsLeft === undefined) {
            this._inputData.roundsLeft = 1;
        }
    }

    /**
     * Called when a new Action is added to the stack in the battle system. This function generates the
     * actions that respond the event
     * @param {BattleContext} battleContext 
     * @param {ActiveAction} activeAction 
     * @returns {ActionGeneratorObject}
     */
    *actionBeginEvent(battleContext, activeAction) {
        if(!matchAttackAction(activeAction.action, {srcAgent: this.targetPlayer})) {
            return;
        }

        const inpuData = /**@type {ElementalBoostData}*/(yield true);
        if (matchAttackAction(activeAction.action, {elements: [inpuData.element], srcAgent: this.targetPlayer})) {
            yield {
                actionModAction: {
                    targetAction: activeAction.action,
                    action: 'buff',
                    targetId: this.targetPlayer.getData().id,
                    /**
                     * 
                     * @param {import("../action").Action} action 
                     */
                    modFunction(action) {
                        if (!action.playerAction) {return}
                        if (!action.playerAction.baseDamageChange) {
                            action.playerAction.baseDamageChange = 0;
                        }

                        action.playerAction.baseDamageChange += inpuData.damageBoost;
                    }
                }
            }
        }
    }
}

module.exports = {ElementalBoost};
