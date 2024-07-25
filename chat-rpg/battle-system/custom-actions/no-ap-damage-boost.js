/**
 * @import {AbilityActionData} from "../../datastore-objects/ability"
 * @import {Action} from "../action"
 */

const { BattleAgent } = require("../../datastore-objects/battle-agent");
const { generateActionsFromActionData } = require("../ability-utility");
const { BattleContext } = require("../battle-context");

/**
 * 
 * @param {BattleAgent} user 
 * @param {AbilityActionData} abilityData 
 * @param {{damageIncrease?: number}} inputData 
 * @param {BattleContext} battleContext 
 * @returns {Generator<Action, void, any>}
 */
function *generateActions(user, abilityData, inputData, battleContext) {
    if (!inputData.damageIncrease) {
        inputData.damageIncrease = 0;
    }

    if (user.getData().ap === 0 && abilityData.baseDamage) {
        abilityData.baseDamage += inputData.damageIncrease;
    }

    yield* generateActionsFromActionData(user, abilityData, battleContext, {disableCustomActions: true});
}

module.exports = {generateActions};
