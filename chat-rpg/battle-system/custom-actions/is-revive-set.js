/**
 * @import {AbilityActionData} from "../../datastore-objects/ability"
 * @import {Action} from "../action"
 * @import {BattleContext} from "../battle-context"s
 * @import {AbilityGenUtility} from "../ability-utility"
 */

const { BattleAgent } = require("../../datastore-objects/battle-agent");
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

    if(!inputData.invert && targetPlayer.getData().effectsMap['revive'] ||
    inputData.invert && !targetPlayer.getData().effectsMap['revive']) {
        yield* utilities.generateActionsFromActionData(user, abilityData, battleContext);
    }
    else {
        if (inputData.invert) {
            yield {
                infoAction: {
                    description: `${targetPlayer.getData().name} is already prepared to revive.`,
                    action: 'unsuccessful',
                    targetAgentId: targetPlayer.getData().id,
                    srcAgentId: targetPlayer.getData().id
                }
            };
        }
        else {
            yield {
                infoAction: {
                    description: `${targetPlayer.getData().name} is not prepared to revive.`,
                    action: 'unsuccessful',
                    targetAgentId: targetPlayer.getData().id,
                    srcAgentId: targetPlayer.getData().id
                }
            };
        }
    }
}

module.exports = {generateActions};
