/**
 * @import {AbilityActionData} from "../../datastore-objects/ability"
 * @import {Action} from "../action"
 * @import {BattleContext} from "../battle-context"s
 */

const { BattleAgent } = require("../../datastore-objects/battle-agent");
const { generateStandardActions } = require("../utility");

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

    yield* generateStandardActions(user, abilityData, battleContext);
}

module.exports = {generateActions};
