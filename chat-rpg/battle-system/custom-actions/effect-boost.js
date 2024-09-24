/**
 * @import {AbilityActionData, AbilityData} from "../../datastore-objects/ability"
 * @import {BattleContext} from "../battle-context"s
 * @import {AbilityGenUtility} from "../ability-utility"
 */

const { BattleAgent } = require("../../datastore-objects/battle-agent");
const { TargetEnum } = require("../action");
const { getTarget } = require("../utility");

/**
 * 
 * @param {BattleAgent} user 
 * @param {AbilityActionData} abilityData 
 * @param {{
 * damageIncrease?: number,
 * effectClass?: string,
 * target?: TargetEnum,
 * extraAbility?: AbilityData
 * }} inputData 
 * @param {BattleContext} battleContext 
 * @param {AbilityGenUtility} utilities 
 */
function *generateActions(user, abilityData, inputData, battleContext, utilities) {
    const targetStr = inputData.target ? inputData.target : 'opponent';
    const target = getTarget(user, targetStr, battleContext);
    if (inputData.effectClass && battleContext.getEffectCount(inputData.effectClass, target)) {
        if (abilityData.baseDamage && inputData.damageIncrease) {
            abilityData.baseDamage += inputData.damageIncrease;
        }
        yield* utilities.generateActionsFromActionData(user, abilityData, battleContext);

        if (inputData.extraAbility) {
            yield* utilities.generateMoveActions(user, inputData.extraAbility, battleContext);
        }
        return;
    }

    yield* utilities.generateActionsFromActionData(user, abilityData, battleContext);
}

module.exports = {generateActions};
