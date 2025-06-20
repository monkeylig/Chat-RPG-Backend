/**
 * @import {AbilityActionData} from "../../datastore-objects/ability"
 * @import {BattleContext} from "../battle-context"s
 * @import {AbilityGenUtility} from "../ability-utility"
 * @import {BattleAgent} from "../../datastore-objects/battle-agent"
 * @import {Action} from "../action"
 */

const { BattleWeapon } = require("../../datastore-objects/battle-agent");

/**
 * 
 * @param {BattleAgent} user 
 * @param {AbilityActionData} abilityData 
 * @param {{damageMultiplier?: number}} inputData 
 * @param {BattleContext} battleContext 
 * @param {AbilityGenUtility} utilities 
 * @returns {Generator<Action, void, any>}
 */
function *generateActions(user, abilityData, inputData, battleContext, utilities) {
    if (!inputData.damageMultiplier) {
        inputData.damageMultiplier = 1;
    }

    const weapon = new BattleWeapon(user.getData().weapon);
    if(abilityData.baseDamage) {
        abilityData.baseDamage += (weapon.getModifiedSpeed() - weapon.getData().speed) * inputData.damageMultiplier;
    }

    yield* utilities.generateActionsFromActionData(user, abilityData, battleContext);
}

module.exports = {generateActions};
