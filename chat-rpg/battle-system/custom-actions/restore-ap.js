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
 * @param {{deplete?: boolean}} inputData 
 * @param {BattleContext} battleContext 
 * @param {AbilityGenUtility} utilities 
 * @returns {Generator<Action, void, any>}
 */
function *generateActions(user, abilityData, inputData, battleContext, utilities) {
    const targetPlayer = getTarget(user, abilityData.target, battleContext);
    const targetPlayerData = targetPlayer.getData();

    if (!inputData.deplete) {
        const missingAp = targetPlayerData.maxAp - targetPlayerData.ap;
        abilityData.apChange = missingAp;
    }
    else {
        abilityData.apChange = -targetPlayerData.ap;   
    }

    yield* utilities.generateActionsFromActionData(user, abilityData, battleContext);
}

module.exports = {generateActions};
