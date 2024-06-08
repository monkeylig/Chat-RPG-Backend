/**
 * @typedef {import("./battle-steps").BattleStep} BattleStep
 * @typedef {import("./action").Action} Action
 */

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
        if(action.playerAction.baseDamage) {
            const hitSteps = BattleSteps.genHitSteps(action.playerAction.srcPlayer,
                action.playerAction.targetPlayer,
                action.playerAction.baseDamage,
                action.playerAction.type, action.playerAction.style, [], {}, {})
            steps.push(...hitSteps);
        }
    }
    return steps;
}

const ActionExecutor = {
    execute: executeAction
}

module.exports = ActionExecutor;
