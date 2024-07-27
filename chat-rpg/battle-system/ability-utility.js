/**
 * @import {Action} from "./action"
 * @import {AbilityData} from "../datastore-objects/ability"
 * @import {ItemData} from "../datastore-objects/item"
 * @import {AbilityActionData} from "../datastore-objects/ability"
 */

const AbilityTypes = require("../datastore-objects/ability");
const { BattleAgent } = require("../datastore-objects/battle-agent");
const { BattleContext } = require("./battle-context");
const customActions = require("./custom-actions/custom-actions");
const { getTarget, generateStandardActions } = require("./utility");

/**
 * 
 * @param {BattleAgent} user 
 * @param {AbilityActionData} actionData 
 * @param {BattleContext} battleContext 
 * @param {{disableCustomActions?: boolean}} [options={}] 
 * @returns {Generator<Action, void, any>}
 */
function *generateActionsFromActionData(user, actionData, battleContext, options = {}) {

    if (actionData.customActions && customActions[actionData.customActions.name] && !options.disableCustomActions) {
        const customActionData = actionData.customActions;       
        yield* customActions[customActionData.name].generateActions(user, actionData, customActionData.data, battleContext);
    }
    else {
        yield* generateStandardActions(user, actionData, battleContext, options);
    }
}

/**
 * @typedef {Object} MoveActionOptions
 * @property {boolean} [skipAnimation]
 * @property {boolean} [disableCustomActions]
 * 
 * @param {BattleAgent} user 
 * @param {AbilityData | ItemData} moveData 
 * @param {BattleContext} battleContext 
 * @param {MoveActionOptions} options 
 * @returns {Generator<Action, void, any>}
 */
function *generateMoveActions(user, moveData, battleContext, options = {}) {
    let target = getTarget(user, moveData.target, battleContext);

    if(!options.skipAnimation && moveData.animation) {
        yield {
            infoAction: {
                description: '',
                action: 'animation',
                animation: moveData.animation,
                targetAgentId: target.getData().id,
                srcAgentId: user.getData().id
            }
        };
    }

    for (const action of generateActionsFromActionData(user, moveData, battleContext, options)) {
        yield action;
    }

    if (moveData.postActions) {
        for (const actionData of moveData.postActions) {
            for (const action of generateActionsFromActionData(user, actionData, battleContext, options)) {
                yield action;
            }       
        }
    }
}

/**
 * 
 * @param {BattleAgent} user
 * @param {AbilityTypes.AbilityData} abilityData 
 * @param {BattleContext} battleContext
 * @param {MoveActionOptions} options
 * @returns {Generator<Action, void, any>}
 */
function *generateAbilityActions(user, abilityData, battleContext, options = {}) {
    for (const action of generateMoveActions(user, abilityData, battleContext, options)) {
        yield action;
    }
}

module.exports = {generateAbilityActions, generateMoveActions, generateActionsFromActionData}