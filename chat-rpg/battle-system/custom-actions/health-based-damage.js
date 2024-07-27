/**
 * @import {AbilityActionData} from "../../datastore-objects/ability"
 * @import {Action} from "../action"
 */

const { BattleAgent } = require("../../datastore-objects/battle-agent");
const { BattleContext } = require("../battle-context");
const { generateStandardActions } = require("../utility");

/**
 * 
 * @param {BattleAgent} user 
 * @param {AbilityActionData} abilityData 
 * @param {{bonusDamage: number}} inputData 
 * @param {BattleContext} battleContext 
 * @returns {Generator<Action, void, any>}
 */
function *generateActions(user, abilityData, inputData, battleContext) {
    if (abilityData.baseDamage) {
        const healthPercent = user.getData().health / user.getData().maxHealth;
        abilityData.baseDamage = abilityData.baseDamage + (inputData.bonusDamage*healthPercent);
    }

    for (const action of generateStandardActions(user, abilityData, battleContext, {disableCustimActions: true})) {
        yield action;
    }
}

module.exports = {generateActions};
