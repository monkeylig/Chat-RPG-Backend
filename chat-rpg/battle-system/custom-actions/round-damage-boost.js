/**
 * @import {BattleAgent} from "../../datastore-objects/battle-agent"
 * @import {AbilityActionData} from "../../datastore-objects/ability"
 * @import {BattleContext} from "../battle-context"
 * @import {Action} from "../action"
 */

const { generateStandardActions } = require("../utility");

/**
 * 
 * @param {BattleAgent} user 
 * @param {AbilityActionData} abilityData 
 * @param {{damagePerRound?: number}} inputData 
 * @param {BattleContext} battleContext 
 * @returns {Generator<Action, void, any>}
 */
function *generateActions(user, abilityData, inputData, battleContext) {
    if (!inputData.damagePerRound) {
        inputData.damagePerRound = 0;
    }

    if (abilityData.baseDamage) {
        abilityData.baseDamage += inputData.damagePerRound * battleContext.battle.round;
    }

    yield* generateStandardActions(user, abilityData, battleContext);
}

module.exports = {generateActions};
