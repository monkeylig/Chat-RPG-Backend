const AbilityEffects = require('./ability-effects/ability-effects');
const StandardSteps = require('./ability-effects/standard-steps');


function EffectSteps(ability, battle, user, opponent, contextControl) {

    const effectName = ability.getData().effectName;

    if(!AbilityEffects[effectName] || !AbilityEffects[effectName].onActivate) {
        return;
    }

    return AbilityEffects[effectName].onActivate(ability, battle, user, opponent, contextControl);
}

const AbilityFunctions = {
    standardSteps: StandardSteps,
    effectSteps: EffectSteps
};

module.exports = AbilityFunctions;