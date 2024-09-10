/**
 * @import {AbilityActionData} from "../../datastore-objects/ability"
 * @import {BattleContext} from "../battle-context"s
 * @import {AbilityGenUtility} from "../ability-utility"
 */

const { BattleAgent } = require("../../datastore-objects/battle-agent");
const { PlayerActionType } = require("../action");

/**
 * 
 * @param {BattleAgent} user 
 * @param {AbilityActionData} abilityData 
 * @param {{protectionType?: string}} inputData 
 * @param {BattleContext} battleContext 
 * @param {AbilityGenUtility} utilities 
 */
function *generateActions(user, abilityData, inputData, battleContext, utilities) {
    if (abilityData.baseDamage) {
        if (!inputData.protectionType) {
            inputData.protectionType = PlayerActionType.Physical;
        }
    
        abilityData.baseDamage += user.getProtectionValue(inputData.protectionType);
    }

    yield* utilities.generateActionsFromActionData(user, abilityData, battleContext);
}

module.exports = {generateActions};
