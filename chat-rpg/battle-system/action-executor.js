/**
 * @import {Action} from "./action"
 * @import {BattleStep} from "./battle-steps"
 */

const { BattlePlayer } = require("../datastore-objects/battle-agent");
const BattleSteps = require("./battle-steps");

/**
 * Executes an action that will have side effects on game objects.
 * 
 * @param {Action} [action] - The action to execute
 * @returns {Array<BattleStep>} Battle steps that describe what the action did
 */
function executeAction(action) {
    if(!action) {
        return []
    }

    const steps = [];
    if(action.playerAction) {
        const playerAction = action.playerAction;
        if(playerAction.baseDamage && playerAction.srcPlayer && playerAction.type && playerAction.style) {
            const hitSteps = BattleSteps.genHitSteps(playerAction.srcPlayer,
                playerAction.targetPlayer,
                playerAction.baseDamage,
                playerAction.type, playerAction.style, [], {}, {})
            steps.push(...hitSteps);
        }

        if(playerAction.heal) {
            const healStep = BattleSteps.heal(playerAction.targetPlayer, playerAction.heal);
            steps.push(healStep);
        }

        if(playerAction.revive) {
            const reviveStep = BattleSteps.revive(playerAction.targetPlayer, playerAction.revive);
            steps.push(reviveStep);
        }

        if(playerAction.strikeLevelChange) {
            const strikeLevelChangeStep = BattleSteps.strikeLevelChange(playerAction.targetPlayer, playerAction.strikeLevelChange);
            steps.push(strikeLevelChangeStep);
        }

        if(playerAction.apChange) {
            const apChangeStep = BattleSteps.apChange(playerAction.targetPlayer, playerAction.apChange);
            steps.push(apChangeStep);
        }

        if(playerAction.consumeItem) {
            const consumeItemStep = BattleSteps.consumeItem(/** @type {BattlePlayer} */(playerAction.targetPlayer), playerAction.consumeItem);
            steps.push(consumeItemStep);
        }

        if(playerAction.defenceAmp) {
            const defenceAmpStep = BattleSteps.defenseAmp(playerAction.targetPlayer, playerAction.defenceAmp);
            steps.push(defenceAmpStep);
        }

    }

    if(action.infoAction) {
        const infoActionData = action.infoAction;
        const infoAction = BattleSteps.info(infoActionData.description, action.infoAction.action, infoActionData.srcAgentId, infoActionData.targetAgentId, infoActionData.animation);
        steps.push(infoAction);
    }

    if(action.battleContextAction) {
        const battleContextAction = action.battleContextAction;
        if(battleContextAction.addEffect) {
            const addEffectStep = BattleSteps.addEffect(battleContextAction.battleContext, battleContextAction.addEffect);
            steps.push(addEffectStep);
        }

        if(battleContextAction.removeEffect) {
            const removeEffectStep = BattleSteps.removeEffect(battleContextAction.battleContext, battleContextAction.removeEffect);
            steps.push(removeEffectStep);
        }
    }
    return steps;
}

const ActionExecutor = {
    execute: executeAction
}

module.exports = {ActionExecutor};
