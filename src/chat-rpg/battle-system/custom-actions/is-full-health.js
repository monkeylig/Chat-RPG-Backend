/**
 * @import {AbilityActionData} from "../../datastore-objects/ability"
 * @import {BattleContext} from "../battle-context"s
 * @import {AbilityGenUtility} from "../ability-utility"
 * @import {BattleAgent} from "../../datastore-objects/battle-agent"
 * @import {Action} from "../action"
 */

const { getTarget } = require("../utility");

/**
 * 
 * @param {BattleAgent} user 
 * @param {AbilityActionData} abilityData 
 * @param {{invert?: boolean}} inputData 
 * @param {BattleContext} battleContext 
 * @param {AbilityGenUtility} utilities 
 * @returns {Generator<Action, void, any>}
 */
function *generateActions(user, abilityData, inputData, battleContext, utilities) {
    const targetPlayer = getTarget(user, abilityData.target, battleContext);
    if (inputData.invert === undefined) {
        inputData.invert = false;
    }

    if (!inputData.invert && targetPlayer.getData().health === targetPlayer.getData().maxHealth ||
    targetPlayer.getData().health < targetPlayer.getData().maxHealth && inputData.invert) {
        yield* utilities.generateActionsFromActionData(user, abilityData, battleContext);
    }
    else {
        if (inputData.invert) {
            yield {
                infoAction: {
                    description: `${targetPlayer.getData().name}'s health is full.`,
                    action: 'unsuccessful',
                    targetAgentId: targetPlayer.getData().id,
                    srcAgentId: targetPlayer.getData().id
                }
            };
        }
        else {
            yield {
                infoAction: {
                    description: `${targetPlayer.getData().name}'s health is not full.`,
                    action: 'unsuccessful',
                    targetAgentId: targetPlayer.getData().id,
                    srcAgentId: targetPlayer.getData().id
                }
            };
        }
    }
}

module.exports = {generateActions};
