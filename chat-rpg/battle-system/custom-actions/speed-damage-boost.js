/**
 * @import {AbilityActionData} from "../../datastore-objects/ability"
 * @import {BattleContext} from "../battle-context"s
 */

const { BattleAgent, BattleWeapon } = require("../../datastore-objects/battle-agent");
const { generateStandardActions } = require("../utility");

/**
 * 
 * @param {BattleAgent} user 
 * @param {AbilityActionData} abilityData 
 * @param {{damageMultiplier?: number}} inputData 
 * @param {BattleContext} battleContext 
 */
function *generateActions(user, abilityData, inputData, battleContext) {
    if (!inputData.damageMultiplier) {
        inputData.damageMultiplier = 1;
    }

    const weapon = new BattleWeapon(user.getData().weapon);
    if(abilityData.baseDamage) {
        abilityData.baseDamage += (weapon.getModifiedSpeed() - weapon.getData().speed) * inputData.damageMultiplier;
    }

    yield* generateStandardActions(user, abilityData, battleContext, {disableCustomActions: true});
}

module.exports = {generateActions};
