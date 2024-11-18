/**
 * @import {AbilityData} from "../../datastore-objects/ability"
 * @import {BattleContext} from "../battle-context"
 * @import {ActiveAction} from "../battle-system-types"
 * @import {BattleStep, InfoBattleStep} from "../battle-steps"
 * @import {ActionGeneratorObject} from "../action-generator"
 * @import {ActionFilter} from "../utility"
 */

const { BattleAgent } = require("../../datastore-objects/battle-agent");
const { generateMoveActions } = require("../ability-utility");
const { Effect } = require("../effect");
const { matchPlayerAction, findBattleStep } = require("../utility");

/**
 * @typedef {Object} ActionTriggerEffectData
 * @property {{
 * user: 'send' | 'receive',
 * playerAction: {
 *  isAttack: boolean,
 *  elements: string[]
 *  }}} filter
 * @property {AbilityData} ability
 * @property {number} roundsLeft
 */

/**
 * Action trigger class
 */
class ActionTriggerEffect extends Effect {
    /**
     * 
     * @param {BattleAgent} targetAgent 
     * @param {ActionTriggerEffectData} inputData 
     */
    constructor(targetAgent, inputData) {
        super(targetAgent, inputData);
        this.name = "ActionTrigger";
        this.unique = false;

        if (!this._inputData.filter) {
            this._inputData.filter = {};
        }

        if (!this._inputData.ability) {
            this._inputData.ability = {};
        }

        if (!this._inputData.user) {
            this._inputData.user = 'send';
        }

        if (this._inputData.roundsLeft === undefined) {
            this._inputData.roundsLeft = 1;
        }
    }

    getInputData() {
        return /**@type {ActionTriggerEffect}*/(this._inputData);
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
        const infoStep = /**@type {InfoBattleStep|undefined}*/(findBattleStep('info', battleSteps));
        if (infoStep && infoStep.action === 'dodge') {
            return;
        }

        const inputData = /**@type {ActionTriggerEffectData} */(yield true);

        if (inputData.filter.playerAction) {
            const actionFilter = inputData.filter.playerAction; 
            /**@type {ActionFilter} */
            const filter = {};
            filter.isAttack = actionFilter.isAttack
            filter.elements = actionFilter.elements;

            if (inputData.filter.user === "send") {
                filter.srcAgent = this.targetPlayer;
            }
            else if (inputData.filter.user === "receive") {
                filter.targetAgent = this.targetPlayer;
            }

            if (matchPlayerAction(activeAction.action, filter)) {
                yield *generateMoveActions(this.targetPlayer, inputData.ability, battleContext);
            }
        }
    }
}

module.exports = {ActionTriggerEffect}