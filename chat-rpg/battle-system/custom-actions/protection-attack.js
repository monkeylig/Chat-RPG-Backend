/**
 * @import {AbilityActionData} from "../../datastore-objects/ability"
 * @import {BattleContext} from "../battle-context"s
 */

const { BattleAgent } = require("../../datastore-objects/battle-agent");
const { PlayerActionType } = require("../action");
const { generateStandardActions } = require("../utility");

/**
 * 
 * @param {BattleAgent} user 
 * @param {AbilityActionData} abilityData 
 * @param {{protectionType?: string}} inputData 
 * @param {BattleContext} battleContext 
 */
function *generateActions(user, abilityData, inputData, battleContext) {
    if (abilityData.baseDamage) {
        if (!inputData.protectionType) {
            inputData.protectionType = PlayerActionType.Physical;
        }
    
        abilityData.baseDamage += user.getProtectionValue(inputData.protectionType);
    }

    yield* generateStandardActions(user, abilityData, battleContext, {disableCustomActions: true});
}

module.exports = {generateActions};
