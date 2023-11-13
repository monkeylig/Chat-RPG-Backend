const { BattlePlayer, BattleWeapon } = require("./datastore-objects/battle-agent");
const gameplayObjects = require('./gameplay-objects');
const chatRPGUtility = require('./utility');

const WEAPON_SYNERGY_BONUS = 1.2;

function genHitSteps(srcPlayer, targetPlayer, baseDamage, type, style, elements, stepResults = {}, options = {}) {
    if(!style) {
        throw new Error('Missing style param!');
    }

    if(baseDamage <= 0) {
        return [];
    }

    const steps = [];
    baseDamage += srcPlayer.consumeEmpowermentValue(type);

    let power = type === 'magical' ? srcPlayer.getModifiedMagic() : srcPlayer.getModifiedStrength();
    if(options.overrideDamageModifier) {
        power = srcPlayer.getModifiedStat(options.overrideDamageModifier, `${options.overrideDamageModifier}Amp`);
    }
    
    const srcPlayerData = srcPlayer.getData();

    // make sure we don't devide by 0
    let defence = 1;
    if(targetPlayer.getModifiedDefence()) {
        defence = targetPlayer.getModifiedDefence();
    }

    let defencePen = 0;
    if(options.defencePen) {
        defencePen = options.defencePen;
    }
    defence *= 1 - defencePen;
    let damage = chatRPGUtility.calcHitDamge(srcPlayerData.level, baseDamage, power, defence);

    //Weapon Synergy Bonus
    if(srcPlayerData.weapon.style === style) {
        damage *= WEAPON_SYNERGY_BONUS;
    }

    let searchElements = () => {};
    if(Array.isArray(elements)) {
        searchElements = element => elements.find(e => e === element);
        // Lightning attacking drenched targets bonus
        if(searchElements('lightning') && targetPlayer.getStatusEffect(gameplayObjects.statusEffects.drenched.name)) {
            damage *= 1 + gameplayObjects.statusEffects.drenched.lightningAmp;
        }
    }

    const damageStep = BattleSteps.damage(targetPlayer, damage, type);
    stepResults.damage = damageStep.damage;
    steps.push(damageStep);

    if(Array.isArray(elements)) {
        const inflamed = gameplayObjects.statusEffects.inflamed;
        const surged = gameplayObjects.statusEffects.surged;
        const drenched = gameplayObjects.statusEffects.drenched;
        const frozen = gameplayObjects.statusEffects.frozen;

        if(searchElements('fire')) {
            if(targetPlayer.getStatusEffect(drenched.name)) {
                steps.push(BattleSteps.removeStatusEffect(drenched, targetPlayer));
            }

            if(chatRPGUtility.chance(inflamed.inflictChance)) {
                const inflamedStep = BattleSteps.gainStatusEffect(inflamed, targetPlayer);
                if(inflamedStep) {
                    steps.push(inflamedStep);
                    stepResults.targetInflamed = true;
                }
            }

            if(srcPlayer.getStatusEffect(drenched.name)) {
                steps.push(BattleSteps.removeStatusEffect(drenched, srcPlayer));
            }
        }
        if(searchElements('lightning') && chatRPGUtility.chance(surged.inflictChance)) {
            const surgedStep = BattleSteps.gainStatusEffect(surged, targetPlayer);
            if(surgedStep) {
                steps.push(surgedStep);
                stepResults.targetSurged = true;
            }
        }
        if(searchElements('water')) {
            if(targetPlayer.getStatusEffect(inflamed.name)) {
                steps.push(BattleSteps.removeStatusEffect(drenched, targetPlayer));
            }

            if(!targetPlayer.getStatusEffect(frozen.name) && damage >= targetPlayer.getData().maxHealth * drenched.healthThreshold) {
                const drenchedStep = BattleSteps.gainStatusEffect(drenched, targetPlayer);
                if(drenchedStep) {
                    steps.push(drenchedStep);
                    stepResults.targetDrenched = true;
                }
            }

            if(srcPlayer.getStatusEffect(inflamed.name)) {
                steps.push(BattleSteps.removeStatusEffect(drenched, srcPlayer));
            }
        }
        if(searchElements('ice')) {
            if(targetPlayer.getStatusEffect(drenched.name) && chatRPGUtility.chance(frozen.drenchedInflict)) {
                steps.push(BattleSteps.gainStatusEffect(frozen, targetPlayer));
                steps.push(BattleSteps.removeStatusEffect(drenched, targetPlayer, true));
            }
        }
    }

    return steps;
}

function genStrikeSteps(srcPlayer, targetPlayer) {
    const weapon = new BattleWeapon(srcPlayer.getData().weapon);
    const elements = weapon.getImbuedElements();
    const hitSteps = BattleSteps.genHitSteps(srcPlayer, targetPlayer, srcPlayer.getData().weapon.baseDamage, srcPlayer.getData().weapon.type, srcPlayer.getData().weapon.style, elements);

    return [...hitSteps];
}

function damageStep(targetPlayer, damage, type) {
    const netDamage = Math.floor(damage);
    const targetPlayerData = targetPlayer.getData();
    const damageStep = {
        type: 'damage',
        targetId: targetPlayerData.id,
        damage: netDamage
    };

    //Apply damage step
    targetPlayer.dealDamage(netDamage, type)

    return damageStep;
}

function healStep(srcPlayer, targetPlayer, healAmount) {
    const srcPlayerData = srcPlayer.getData();
    const targetPlayerData = targetPlayer.getData();
    const healStep = {
        type: 'heal',
        actorId: srcPlayerData.id,
        targetId: targetPlayerData.id,
        healAmount: 0
    };

    healStep.healAmount = targetPlayer.heal(healAmount);

    return healStep;
}

function infoStep(description, action, actorId='', targetId='', animation={}) {
    const infoStep = {
        type: 'info',
        description,
        action: action ? action : 'generic',
        actorId: actorId,
        targetId: targetId
    };

    if(animation) {
        infoStep.animation = animation;
    }

    return infoStep;
}

function battleEndStep(description) {
    return {
        type: 'battle_end',
        description
    };
}

function statAmpStep(battlePlayer, stat, ampFunctionName, stages, prefix) {

    let descBeginning = `${battlePlayer.getData().name}'s ${stat}`;
    if(prefix) {
        descBeginning = prefix;
    }

    if(!battlePlayer[ampFunctionName](stages)) {
        return infoStep(`${descBeginning} can't rise any higher.`);
    }

    switch(stages) {
        case 0: {
            return {
                type: ampFunctionName,
                description: `${descBeginning} did not rise at all.`
            };
        }
        case 1: {
            return {
                type: ampFunctionName,
                description: `${descBeginning} rose slightly.`
            };
        }
        case -1: {
            return {
                type: ampFunctionName,
                description: `${descBeginning} fell slightly.`
            };
        }
        case 3: {
            return {
                type: ampFunctionName,
                description: `${descBeginning} rose suddenly!`
            };
        }
        case -3: {
            return {
                type: ampFunctionName,
                description: `${descBeginning} fell suddenly!`
            };
        }
        case 4: {
            return {
                type: ampFunctionName,
                description: `${descBeginning} rose greatly!`
            };
        }
        case -4: {
            return {
                type: ampFunctionName,
                description: `${descBeginning} fell greatly!`
            };
        }
        case 2:
        default: {
            return {
                type: ampFunctionName,
                description: stages > 0 ? `${descBeginning} rose!` : `${descBeginning} fell.`
            };
        }
    }
}

function strengthAmpStep(battlePlayer, stages) {
    return statAmpStep(battlePlayer, 'strength', 'strengthAmp', stages);
}

function defenceAmpStep(battlePlayer, stages) {
    return statAmpStep(battlePlayer, 'defence', 'defenceAmp', stages);
}

function magicAmpStep(battlePlayer, stages) {
    return statAmpStep(battlePlayer, 'magic', 'magicAmp', stages);
}

function fireResistAmpStep(battlePlayer, stages) {
    return statAmpStep(battlePlayer, 'fireResist', 'fireResistAmp', stages);
}

function lighteningResistAmpStep(battlePlayer, stages) {
    return statAmpStep(battlePlayer, 'lighteningResist', 'lighteningResistAmp', stages);
}

function waterResistAmpStep(battlePlayer, stages) {
    return statAmpStep(battlePlayer, 'waterResist', 'waterResistAmp', stages);
}

function iceResistAmpStep(battlePlayer, stages) {
    return statAmpStep(battlePlayer, 'iceResist', 'iceResistAmp', stages);
}

function weaponSpeedAmpStep(battlePlayer, stages) {
    const weapon = new BattleWeapon(battlePlayer.getData().weapon);
    const speedAmpStep = statAmpStep(weapon, 'speed', 'speedAmp', stages, `${battlePlayer.getData().name}'s weapon speed`);
    battlePlayer.getData().weapon = weapon.getData();
    return speedAmpStep;
}

function empowermentStep(battlePlayer, empowerType, empowerValue) {
    battlePlayer.addEmpowerment(empowerType, empowerValue)
    return {
        type: 'empowerment',
        description: `${battlePlayer.getData().name} gained ${empowerValue} ${empowerType} empowerment!`
    };
}

function protectionStep(battlePlayer, type, value) {
    battlePlayer.addProtection(type, value);
    return {
        type: 'protection',
        description: `${battlePlayer.getData().name} gained ${value}% ${type} protection!`
    };
}

function reviveStep(battlePlayer) {
    if (!battlePlayer.isDefeated()) {
        return BattleSteps.info(`${battlePlayer.getData().name} is not defeated.`);
    }

    battlePlayer.revive(battlePlayer.getData().autoRevive);
    battlePlayer.getData().autoRevive = 0;

    return {
        type: 'revive',
        actorId: battlePlayer.getData().id,
        targetId: battlePlayer.getData().id,
        healAmount: battlePlayer.getData().health,
        description: `${battlePlayer.getData().name} was revived!`
    };
}

function apCostStep(battlePlayer, apCost) {
    const battlePlayerData = battlePlayer.getData();
    const netCost = Math.min(apCost, battlePlayerData.ap);
    battlePlayerData.ap -= netCost;

    return {
        type: 'apCost',
        actorId: battlePlayer.getData().id,
        apCost: netCost
    };
}

function readyReviveStep(battlePlayer, reviveAmount = 0.5) {
    battlePlayer.getData().autoRevive = reviveAmount;
    return {
        type: 'readyRevive',
        actorId: battlePlayer.getData().id,
        description: `${battlePlayer.getData().name} will be revived if they are defeated.`
    };
}

function gainStatusEffectStep(statusEffect, targetPlayer, refreshEffect = false) {
    if(!refreshEffect && targetPlayer.getStatusEffect(statusEffect.name)) {
        return;
    }

    targetPlayer.addStatusEffect(statusEffect.name, statusEffect);
    return {
        type: 'gainStatusEffect',
        targetId: targetPlayer.getData().id,
        description: `${targetPlayer.getData().name} is now ${statusEffect.name}!`,
        statusEffect
    };
}

function removeStatusEffectStep(statusEffect, targetPlayer, noDescription = false) {
    if(!targetPlayer.getStatusEffect(statusEffect.name)) {
        return;
    }

    targetPlayer.removeStatusEffect(statusEffect.name);

    const step = {
        type: 'removeStatusEffect',
        targetId: targetPlayer.getData().id,
        statusEffect
    };

    if(!noDescription) {
        step.description = `${targetPlayer.getData().name} is no longer ${statusEffect.name}!`
    }
    return step;
}

function imbueStep(targetAgent, element, durationCondition) {
    const weapon = new BattleWeapon(targetAgent.getData().weapon);
    weapon.imbue(element, durationCondition);

    return {
        type: 'imbue',
        targetId: targetAgent.getData().id,
        description: `${targetAgent.getData().name}'s weapon is imbued with ${element}!`,
        element
    };
}

function removeImbueStep(targetAgent, element) {
    const weapon = new BattleWeapon(targetAgent.getData().weapon);
    weapon.removeImbue(element);

    return {
        type: 'removeImbue',
        targetId: targetAgent.getData().id,
        element
    };
}

function setCounterStep(targetAgent, counterAbility, counterType) {
    targetAgent.setCounter(counterAbility, counterType);

    return {
        type: 'setCounter',
        targetId: targetAgent.getData().id,
        counter: {
            type: counterType,
            ability: counterAbility.getData(),
        },
        description: `${targetAgent} is ready to defend.`
    };
}

function addAbilityStep(targetAgent, ability) {
    targetAgent.addAbility(ability.getData());

    return {
        type: 'addAbility',
        ability: ability.getData(),
        targetId: targetAgent.getData().id,
    };
}

function removeAblityStep(targetAgent, abilityName) {
    const abilityData = targetAgent.removeAbility(abilityName);

    return {
        type: 'removeAblity',
        targetId: targetAgent.getData().id,
        ability: abilityData
    };
}

function addAbilityStrikeStep(targetAgent, ability, durationCondition) {
    targetAgent.addAbilityStrike(ability, durationCondition);

    return {
        type: 'addAbilityStrike',
        targetId: targetAgent.getData().id,
        ability: ability.getData()
    };
}

const BattleSteps = {
    damage: damageStep,
    heal: healStep,
    info: infoStep,
    battleEnd: battleEndStep,
    strengthAmp: strengthAmpStep,
    defenceAmp: defenceAmpStep,
    magicAmp: magicAmpStep,
    fireResistAmp: fireResistAmpStep,
    lighteningResistAmp: lighteningResistAmpStep,
    waterResistAmp: waterResistAmpStep,
    iceResistAmp: iceResistAmpStep,
    weaponSpeedAmp: weaponSpeedAmpStep,
    empowerment: empowermentStep,
    protection: protectionStep,
    revive: reviveStep,
    apCost: apCostStep,
    readyRevive: readyReviveStep,
    gainStatusEffect: gainStatusEffectStep,
    removeStatusEffect: removeStatusEffectStep,
    imbue: imbueStep,
    removeImbue: removeImbueStep,
    setCounter: setCounterStep,
    addAbility: addAbilityStep,
    removeAbility: removeAblityStep,
    addAbilityStrike: addAbilityStrikeStep,
    genHitSteps,
    genStrikeSteps
};

module.exports = BattleSteps;