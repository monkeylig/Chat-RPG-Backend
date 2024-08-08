/**
 * @import {AbilityActionData} from "../../datastore-objects/ability"
 * @import {Action} from "../action"
 * @import {BattleContext} from "../battle-context"s
 */

const { BattleAgent } = require("../../datastore-objects/battle-agent");
const { getTarget } = require("../utility");

/**
 * 
 * @param {BattleAgent} user 
 * @param {AbilityActionData} abilityActionData 
 * @param {Object} inputData 
 * @param {BattleContext} battleContext 
 * @returns {Generator<Action, void, any>}
 */
function *generateActions(user, abilityActionData, inputData, battleContext) {
    const targetPlayer = getTarget(user, abilityActionData.target, battleContext);

    if(targetPlayer.getData().effectsMap['revive']) {
        yield {
            infoAction: {
                description: `${targetPlayer.getData().name} is already prepared to revive.`,
                action: 'unsuccessful',
                targetAgentId: targetPlayer.getData().id,
                srcAgentId: targetPlayer.getData().id
            }
        };
    }
    else {
        yield {
            battleContextAction: {
                addEffect: {
                    className: 'ReviveEffect',
                    targetId: targetPlayer.getData().id,
                    inputData: inputData
                }
            }
        };
    }
}

module.exports = {generateActions};
