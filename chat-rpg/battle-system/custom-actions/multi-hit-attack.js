/**
 * @import {AbilityActionData} from "../../datastore-objects/ability"
 * @import {Action} from "../action"
 */

const Ability = require("../../datastore-objects/ability");
const { BattleAgent } = require("../../datastore-objects/battle-agent");
const { getRandomIntInclusive } = require("../../utility");
const { BattleContext } = require("../battle-context");
const { getTarget, generateStandardActions } = require("../utility");

/**
 * 
 * @param {BattleAgent} user 
 * @param {AbilityActionData} abilityActionData 
 * @param {{minHits: number, maxHits: number}} inputData 
 * @param {BattleContext} battleContext 
 * @returns {Generator<Action, void, any>}
 */
function *generateActions(user, abilityActionData, inputData, battleContext) {
    const hits = getRandomIntInclusive(inputData.minHits, inputData.maxHits);

    const ability = new Ability(abilityActionData);
    for (let i=0; i < hits; i++) {
        for (const action of generateStandardActions(user, abilityActionData, battleContext)) {
            yield action;
        }
    }

    const target = getTarget(user, abilityActionData.target, battleContext);
    yield {
        infoAction: {
            description: `${target} was hit ${hits} times.`,
            targetAgentId: target.getData().id
        }
    };
}

module.exports = {generateActions};
