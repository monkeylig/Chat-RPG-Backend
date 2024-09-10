/**
 * @import {AbilityActionData} from "../../datastore-objects/ability"
 * @import {Action} from "../action"
 * @import {BattleContext} from "../battle-context"s
 * @import {AbilityGenUtility} from "../ability-utility"
 */

const { BattleAgent } = require("../../datastore-objects/battle-agent");
const { getRandomIntInclusive } = require("../../utility");
const { getTarget } = require("../utility");

/**
 * 
 * @param {BattleAgent} user 
 * @param {AbilityActionData} abilityActionData 
 * @param {{minHits: number, maxHits: number}} inputData 
 * @param {BattleContext} battleContext 
 * @param {AbilityGenUtility} utilities 
 * @returns {Generator<Action, void, any>}
 */
function *generateActions(user, abilityActionData, inputData, battleContext, utilities) {
    const hits = getRandomIntInclusive(inputData.minHits, inputData.maxHits);

    const target = getTarget(user, abilityActionData.target, battleContext);
    let hitCount = 0;
    for (let i=0; i < hits; i++) {
        if (abilityActionData.baseDamage && target.isDefeated()) {
            break;
        }
        yield* utilities.generateActionsFromActionData(user, abilityActionData, battleContext);
        hitCount += 1;
    }

    yield {
        infoAction: {
            description: `${user.getData().name} attacked ${hitCount} times.`,
            targetAgentId: target.getData().id
        }
    };
}

module.exports = {generateActions};
