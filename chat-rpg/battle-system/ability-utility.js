/**
 * @import {Action} from "./action"
 * @import {AbilityData} from "../datastore-objects/ability"
 * @import {ItemData} from "../datastore-objects/item"
 */

const AbilityTypes = require("../datastore-objects/ability");
const { BattleAgent } = require("../datastore-objects/battle-agent");
const { BattleContext } = require("./battle-context");
const customActions = require("./custom-actions/custom-actions");
const { getTarget } = require("./utility");

/**
 * @template {AbilityData | ItemData} MoveData
 * 
 * @param {BattleAgent} user 
 * @param {MoveData} moveData 
 * @param {BattleContext} battleContext 
 * @param {{skipAnimation?: boolean}} options 
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

    if (moveData.customActions && customActions[moveData.customActions.name]) {
        const actionData = moveData.customActions;
        for (const action of customActions[actionData.name].generateActions(user, moveData, actionData.data, battleContext)) {
            yield action;
        }
    }
    else {
        const action = {
            playerAction: {
                baseDamage: moveData.baseDamage ? moveData.baseDamage : 0,
                targetPlayer: target,
                srcPlayer: user,
                style: moveData.style,
                type: moveData.type,
                apChange: moveData.apChange
            },
        };
        yield action;
    }
}

/**
 * 
 * @param {BattleAgent} user
 * @param {AbilityTypes.AbilityData} abilityData 
 * @param {BattleContext} battleContext
 * @param {{skipAnimation?: boolean}} options
 * @returns {Generator<Action, void, any>}
 */
function *generateAbilityActions(user, abilityData, battleContext, options = {}) {
    for (const action of generateMoveActions(user, abilityData, battleContext, options)) {
        yield action;
    }
}

module.exports = {generateAbilityActions, generateMoveActions}