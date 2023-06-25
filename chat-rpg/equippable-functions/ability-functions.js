const BattleSteps = require('../battle-steps');
const AbilityEffects = require('./ability-effects/ability-effects');

function StandardSteps (ability, battle, srcPlayer, targetPlayer) {
    const steps = [];

    let baseDamage = ability.getData().baseDamage;

    const effectName = ability.getData().effectName;
    if(AbilityEffects[effectName] && AbilityEffects[effectName].overrideBaseDamage) {
        baseDamage = AbilityEffects[effectName].overrideBaseDamage(ability, battle, srcPlayer, targetPlayer);
    }

    if(baseDamage > 0) {
        const damageStep = BattleSteps.damage(srcPlayer, targetPlayer, baseDamage);
        steps.push(damageStep);

        if(ability.getData().absorb > 0) {
            const absorbStep = BattleSteps.heal(srcPlayer, srcPlayer, damageStep.damage * ability.getData().absorb);
            steps.push(absorbStep);
            steps.push(BattleSteps.info(`${srcPlayer.getData().name} absorbed ${targetPlayer.getData().name}'s health.`, 'absorb', srcPlayer.getData().id))
        }
    }

    if(ability.getData().recoil > 0) {
        const recoilStep = BattleSteps.damage(srcPlayer, srcPlayer, baseDamage * ability.getData().recoil);
        steps.push(recoilStep);
        steps.push(BattleSteps.info(`${srcPlayer.getData().name} was hit by ${ability.getData().name}'s recoil damage.`, 'recoil', srcPlayer.getData().id))
    }

    if(ability.getData().attackAmp > 0) {
        const attackAmpStep = BattleSteps.attackAmp(srcPlayer, ability.getData().attackAmp);
        steps.push(attackAmpStep);
    }

    if(ability.getData().magicAmp > 0) {
        const magicAmpStep = BattleSteps.magicAmp(srcPlayer, ability.getData().magicAmp);
        steps.push(magicAmpStep);
    }

    if(ability.getData().defenceAmp > 0) {
        const defenceAmpStep = BattleSteps.defenceAmp(srcPlayer, ability.getData().defenceAmp);
        steps.push(defenceAmpStep);
    }

    if(ability.getData().weaponSpeedAmp > 0) {
        const speedAmpStep = BattleSteps.weaponSpeedAmp(srcPlayer, ability.getData().weaponSpeedAmp);
        steps.push(speedAmpStep);
    }

    const empowerment = ability.getData().empowerment;
    if(empowerment) {
        for(let type in empowerment) {
            if(empowerment[type] > 0) {
                steps.push(BattleSteps.empowerment(srcPlayer, type, empowerment[type]));
            }
        }
    }

    return steps;
}

function EffectSteps (ability, battle, user, opponent, contextControl) {

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