/**
 * @import {BattleAgent} from "../../datastore-objects/battle-agent"
 * @import {AbilityActionData} from "../../datastore-objects/ability"
 * @import {BattleContext} from "../battle-context"
 * @import {Action} from "../action"
 * @import {AbilityGenUtility} from "../ability-utility"
 */


/**
 * 
 * @param {BattleAgent} user 
 * @param {AbilityActionData} abilityData 
 * @param {{damagePerRound?: number}} inputData 
 * @param {BattleContext} battleContext 
 * @param {AbilityGenUtility} utilities 
 * @returns {Generator<Action, void, any>}
 */
function *generateActions(user, abilityData, inputData, battleContext, utilities) {
    if (!inputData.damagePerRound) {
        inputData.damagePerRound = 0;
    }

    if (abilityData.baseDamage) {
        abilityData.baseDamage += inputData.damagePerRound * battleContext.battle.round;
    }

    yield* utilities.generateActionsFromActionData(user, abilityData, battleContext);
}

module.exports = {generateActions};
