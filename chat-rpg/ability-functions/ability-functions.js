const BattleSteps = require('../battle-steps');

function StandardSteps (ability, srcPlayer, targetPlayer) {
    const steps = [];

    const damageStep = BattleSteps.damage(srcPlayer, targetPlayer, ability.baseDamage);
    steps.push(damageStep);

    return steps;
}

const AbilityFunctions = {
    standardSteps: StandardSteps
};

module.exports = AbilityFunctions;