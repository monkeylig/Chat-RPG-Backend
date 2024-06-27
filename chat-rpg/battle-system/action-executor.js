const { BattlePlayer } = require("../datastore-objects/battle-agent");
const BattleSteps = require("./battle-steps");

/**
 * @typedef {import("./battle-steps").BattleStep} BattleStep
 * @typedef {import("./action").Action} Action
 */

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
        if(action.playerAction.baseDamage && action.playerAction.srcPlayer) {
            const hitSteps = BattleSteps.genHitSteps(action.playerAction.srcPlayer,
                action.playerAction.targetPlayer,
                action.playerAction.baseDamage,
                action.playerAction.type, action.playerAction.style, [], {}, {})
            steps.push(...hitSteps);
        }

        if(action.playerAction.strikeLevelChange) {
            const strikeLevelChangeStep = BattleSteps.strikeLevelChange(action.playerAction.targetPlayer, action.playerAction.strikeLevelChange);
            steps.push(strikeLevelChangeStep);
        }

        if(action.playerAction.apChange) {
            const apChangeStep = BattleSteps.apChange(action.playerAction.targetPlayer, action.playerAction.apChange);
            steps.push(apChangeStep);
        }

        if(action.playerAction.consumeItem) {
            const consumeItemStep = BattleSteps.consumeItem(/** @type {BattlePlayer} */(action.playerAction.targetPlayer), action.playerAction.consumeItem);
            steps.push(consumeItemStep);
        }

    }
    if(action.infoAction) {
        const infoActionData = action.infoAction;
        const infoAction = BattleSteps.info(infoActionData.description, action.infoAction.action, infoActionData.srcAgentId, infoActionData.targetAgentId, infoActionData.animation);
        steps.push(infoAction);
    }
    return steps;
}

const ActionExecutor = {
    execute: executeAction
}

module.exports = {ActionExecutor};
