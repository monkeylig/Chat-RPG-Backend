const AbilityTypes = require("../datastore-objects/ability");
const { BattleAgent } = require("../datastore-objects/battle-agent");
const ActionGeneratorTypes = require("./action-generator");
const { BattleContext } = require("./battle-context");

/**
 * 
 * @param {BattleAgent} user
 * @param {AbilityTypes.AbilityData} abilityData 
 * @param {BattleContext} battleContext
 * @param {{skipAnimation?: boolean}} options
 * @returns {ActionGeneratorTypes.ActionGeneratorObject}
 */
function *generateAbilityActions(user, abilityData, battleContext, options = {}) {
    let target = abilityData.target == 'opponent' ? battleContext.getOpponent(user) : user;
    if (!target) {
        target = user;
    }

    if(!options.skipAnimation) {
        yield {
            infoAction: {
                description: '',
                action: 'animation',
                animation: abilityData.animation,
                targetAgentId: target.getData().id,
                srcAgentId: user.getData().id
            }
        };
    }

    yield {
        playerAction: {
            baseDamage: abilityData.baseDamage ? abilityData.baseDamage : 0,
            targetPlayer: target,
            srcPlayer: user,
            style: abilityData.style,
            type: abilityData.type,
            apChange: abilityData.apChange
        }
    };
}

module.exports = {generateAbilityActions}