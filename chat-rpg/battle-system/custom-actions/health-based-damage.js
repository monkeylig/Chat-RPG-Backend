/**
 * @import {AbilityActionData} from "../../datastore-objects/ability"
 * @import {Action} from "../action"
 * @import {BattleContext} from "../battle-context"
 * @import {AbilityGenUtility} from "../ability-utility"
 */

const { BattleAgent } = require("../../datastore-objects/battle-agent");

/**
 * 
 * @param {BattleAgent} user 
 * @param {AbilityActionData} abilityData 
 * @param {{bonusDamage: number}} inputData 
 * @param {BattleContext} battleContext 
 * @param {AbilityGenUtility} utilities 
 * @returns {Generator<Action, void, any>}
 */
function *generateActions(user, abilityData, inputData, battleContext, utilities) {
    if (abilityData.baseDamage) {
        const healthPercent = user.getData().health / user.getData().maxHealth;
        abilityData.baseDamage = abilityData.baseDamage + (inputData.bonusDamage*healthPercent);
    }

    yield* utilities.generateActionsFromActionData(user, abilityData, battleContext);
}

module.exports = {generateActions};
