/**
 * @import {AbilityActionData} from "../../datastore-objects/ability"
 */

const { BattleAgent } = require("../../datastore-objects/battle-agent");
const { BattleContext } = require("../battle-context");
const { generateStandardActions } = require("../utility");

/**
 * 
 * @param {BattleAgent} user 
 * @param {AbilityActionData} abilityData 
 * @param {{damageIncrease?: number, effectClass?: string}} inputData 
 * @param {BattleContext} battleContext 
 */
function *generateActions(user, abilityData, inputData, battleContext) {
    if (abilityData.baseDamage && inputData.damageIncrease && inputData.effectClass) {    
        if (battleContext.getEffectCount(inputData.effectClass, user)) {
            abilityData.baseDamage += inputData.damageIncrease;
        }
    }

    yield* generateStandardActions(user, abilityData, battleContext, {disableCustomActions: true});
}

module.exports = {generateActions};
