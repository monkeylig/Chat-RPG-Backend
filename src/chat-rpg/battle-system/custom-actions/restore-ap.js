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

    yield* utilities.generateActionsFromActionData(user, abilityData, battleContext);
    
    let apChange = 0;
    if (!inputData.deplete) {
        const missingAp = targetPlayerData.maxAp - targetPlayerData.ap;
        apChange = missingAp;
    }
    else {
        apChange = -targetPlayerData.ap;   
    }

    if (apChange) {
        /**@type {Action} */
        yield {
            playerAction: {
                targetPlayer,
                type: abilityData.type,
                style: abilityData.style,
                elements: abilityData.elements,
                apChange
            }
        };
    }
}

module.exports = {generateActions};
