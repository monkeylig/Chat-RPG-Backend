/**
 * @import {ItemData} from "../../datastore-objects/item"
 * @import {Action} from "../action"
 */

const { BattleAgent } = require("../../datastore-objects/battle-agent");
const { BattleContext } = require("../battle-context");
const { ReviveEffect } = require("../effects/revive-effect");
const { getTarget } = require("../utility");

/**
 * 
 * @param {BattleAgent} user 
 * @param {ItemData} itemData 
 * @param {any} inputData 
 * @param {BattleContext} battleContext 
 * @returns {Generator<Action, void, any>}
 */
function *generateActions(user, itemData, inputData, battleContext) {
    const targetPlayer = getTarget(user, itemData.target, battleContext);

    if(targetPlayer.getData().effectsMap['revive']) {
        yield {
            infoAction: {
                description: `${targetPlayer.getData().name} is already prepared to revive.`,
                action: 'itemNotReady',
                targetAgentId: targetPlayer.getData().id,
                srcAgentId: targetPlayer.getData().id
            }
        };
    }
    else {
        const reviveEffect = new ReviveEffect(targetPlayer, inputData);
        yield {
            battleContextAction: {
                battleContext,
                addEffect: reviveEffect
            }
        };
    }
}

module.exports = {generateActions};
