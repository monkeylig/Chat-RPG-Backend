const BattleSteps = require('../battle-steps');
const Ability = require('../datastore-objects/ability');
const gameplayObjects = require('../gameplay-objects');
const { chance } = require('../utility');
const AbilityEffects = require('./ability-effects/ability-effects');

function StandardSteps (ability, battle, srcPlayer, targetPlayer) {
    const steps = [];

    let baseDamage = ability.getData().baseDamage;

    const effectName = ability.getData().effectName;
    if(AbilityEffects[effectName] && AbilityEffects[effectName].overrideBaseDamage && battle) {
        baseDamage = AbilityEffects[effectName].overrideBaseDamage(ability, battle, srcPlayer, targetPlayer);
    }

    if(baseDamage > 0) {
        const hitStepResults = {};
        const options = {
            defensePen: ability.getData().defensePen,
            overrideDamageModifier: ability.getData().overrideDamageModifier
        };
        steps.push(...BattleSteps.genHitSteps(srcPlayer, targetPlayer, baseDamage, ability.getData().type, ability.getData().style, ability.getData().elements, hitStepResults, options));

        if(ability.getData().absorb > 0) {
            const absorbStep = BattleSteps.heal(srcPlayer, srcPlayer, hitStepResults.damage * ability.getData().absorb);
            steps.push(absorbStep);
            steps.push(BattleSteps.info(`${srcPlayer.getData().name} absorbed ${targetPlayer.getData().name}'s health.`, 'absorb', srcPlayer.getData().id, targetPlayer.getData().id))
        }
    }

    if(ability.getData().heal > 0) {
        const healStep = BattleSteps.heal(srcPlayer, srcPlayer, ability.getData().heal);
        steps.push(healStep);
    }

    if(chance(ability.getData().inflameChance)) {
        const inflameStep = BattleSteps.gainStatusEffect(gameplayObjects.statusEffects.inflamed, targetPlayer);
        if(inflameStep) {
            steps.push(inflameStep);
        }
    }

    if(ability.getData().recoil > 0) {
        const recoilStep = BattleSteps.damage(srcPlayer, srcPlayer.getData().maxHealth * ability.getData().recoil, ability.getData().type);
        steps.push(recoilStep);
        steps.push(BattleSteps.info(`${srcPlayer.getData().name} was hit by ${ability.getData().name}'s recoil damage.`, 'recoil', srcPlayer.getData().id, targetPlayer.getData().id))
    }

    if(ability.getData().relativeRecoil > 0) {
        const recoilStep = BattleSteps.damage(srcPlayer, srcPlayer.getData().health * ability.getData().relativeRecoil, ability.getData().type);
        steps.push(recoilStep);
        steps.push(BattleSteps.info(`${srcPlayer.getData().name} was hit by ${ability.getData().name}'s recoil damage.`, 'recoil', srcPlayer.getData().id, targetPlayer.getData().id))
    }

    if(ability.getData().strengthAmp) {
        const strengthAmpStep = BattleSteps.strengthAmp(srcPlayer, ability.getData().strengthAmp);
        steps.push(strengthAmpStep);
    }

    if(ability.getData().targetStrengthAmp) {
        const strengthAmpStep = BattleSteps.strengthAmp(targetPlayer, ability.getData().targetStrengthAmp);
        steps.push(strengthAmpStep);
    }

    if(ability.getData().magicAmp) {
        const magicAmpStep = BattleSteps.magicAmp(srcPlayer, ability.getData().magicAmp);
        steps.push(magicAmpStep);
    }

    if(ability.getData().targetMagicAmp) {
        const magicAmpStep = BattleSteps.magicAmp(targetPlayer, ability.getData().targetMagicAmp);
        steps.push(magicAmpStep);
    }

    if(ability.getData().defenseAmp) {
        const defenseAmpStep = BattleSteps.defenseAmp(srcPlayer, ability.getData().defenseAmp);
        steps.push(defenseAmpStep);
    }

    if(ability.getData().targetDefenseAmp) {
        const defenseAmpStep = BattleSteps.defenseAmp(targetPlayer, ability.getData().targetDefenseAmp);
        steps.push(defenseAmpStep);
    }

    if(ability.getData().weaponSpeedAmp) {
        const speedAmpStep = BattleSteps.weaponSpeedAmp(srcPlayer, ability.getData().weaponSpeedAmp);
        steps.push(speedAmpStep);
    }

    if(ability.getData().targetWeaponSpeedAmp) {
        const speedAmpStep = BattleSteps.weaponSpeedAmp(targetPlayer, ability.getData().targetWeaponSpeedAmp);
        steps.push(speedAmpStep);
    }

    if(ability.getData().fireResistAmp) {
        const fireResistAmp = BattleSteps.fireResistAmp(srcPlayer, ability.getData().fireResistAmp);
        steps.push(fireResistAmp);
    }

    if(ability.getData().targetFireResistAmp) {
        const fireResistAmp = BattleSteps.fireResistAmp(targetPlayer, ability.getData().targetFireResistAmp);
        steps.push(fireResistAmp);
    }

    if(ability.getData().lightningResistAmp) {
        const lightningResistAmp = BattleSteps.lightningResistAmp(srcPlayer, ability.getData().lightningResistAmp);
        steps.push(lightningResistAmp);
    }

    if(ability.getData().targetLightningResistAmp) {
        const lightningResistAmp = BattleSteps.lightningResistAmp(targetPlayer, ability.getData().targetLightningResistAmp);
        steps.push(lightningResistAmp);
    }

    const empowerment = ability.getData().empowerment;
    if(empowerment) {
        for(const type in empowerment) {
            if(empowerment[type] > 0) {
                steps.push(BattleSteps.empowerment(srcPlayer, type, empowerment[type]));
            }
        }
    }

    const protection = ability.getData().protection;
    if(protection) {
        for(const type in protection) {
            if(protection[type] > 0) {
                steps.push(BattleSteps.protection(srcPlayer, type, protection[type]));
            }
        }
    }

    if(ability.getData().strikeLevelChange) {
        steps.push(BattleSteps.strikeLevelChange(srcPlayer, ability.getData().strikeLevelChange));
        if(srcPlayer.getData().strikeLevel === srcPlayer.STRIKE_ABILITY_TRIGGER) {
            steps.push(BattleSteps.info(`${srcPlayer.getData().name}'s strike ability is ready!`));
        }
    }

    if(ability.getData().apReduce) {
        steps.push(BattleSteps.apCost(srcPlayer, ability.getData().apReduce));
    }

    if(ability.getData().apGain) {
        steps.push(BattleSteps.apGain(srcPlayer, ability.getData().apGain));
    }

    const imbue = ability.getData().imbue;
    for(const element in ability.getData().imbue) {
        if(imbue[element]) {
            steps.push(BattleSteps.imbue(srcPlayer, element, imbue[element]));
        }
    }

    if(ability.getData().addAbilities && ability.getData().addAbilities.length > 0) {
        for(const newAbility of ability.getData().addAbilities) {
            steps.push(BattleSteps.addAbility(srcPlayer, new Ability(newAbility)));
        }
    }

    if(ability.getData().addAbilityStrikes && ability.getData().addAbilityStrikes.length > 0) {
        for(const abilityStrike of ability.getData().addAbilityStrikes) {
            steps.push(BattleSteps.addAbilityStrike(srcPlayer, new Ability(abilityStrike.ability), abilityStrike.durationCondition));
        }
    }

    return steps;
}

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