const { BattleAgent } = require("../datastore-objects/battle-agent");
const { BattleContext } = require("./battle-context");

/**
 * 
 * @param {BattleAgent} user 
 * @param {string} targetStr 
 * @param {BattleContext} battleContext 
 * @returns {BattleAgent}
 */
function getTarget(user, targetStr, battleContext) {
    const target = targetStr === 'opponent' ? battleContext.getOpponent(user) : user;
    if (!target) {
        return user;
    }

    return target;
}

module.exports = {getTarget}
