const BattleSteps = require('../battle-steps');
const AbilityEffects = require('./ability-effects/ability-effects');

function StandardSteps (ability, srcPlayer, targetPlayer) {
    const steps = [];

    if(ability.baseDamage > 0) {
        const damageStep = BattleSteps.damage(srcPlayer, targetPlayer, ability.baseDamage);
        steps.push(damageStep);
    }

    return steps;
}

function EffectSteps (ability, battle, user, opponent, contextControl) {

    if(!AbilityEffects[ability.effectName]) {
        return;
    }

    return AbilityEffects[ability.effectName].onActivate(ability, battle, user, opponent, contextControl);;
}

const AbilityFunctions = {
    standardSteps: StandardSteps,
    effectSteps: EffectSteps
};

module.exports = AbilityFunctions;