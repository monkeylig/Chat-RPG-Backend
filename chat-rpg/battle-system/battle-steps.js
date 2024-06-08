const { BattleWeapon, BattleAgent, BattlePlayer } = require('../datastore-objects/battle-agent');
const gameplayObjects = require('../gameplay-objects');
const chatRPGUtility = require('../utility');

const WEAPON_SYNERGY_BONUS = 1.2;
const ELEMENTAL_BURST_BONUS = 1.5;

/**
 * @typedef {Object} BattleStep
 * @property {string} type
 * @property {string} [description]
 */

/**
 * 
 * @param {BattleAgent} srcPlayer 
 * @param {BattleAgent} targetPlayer 
 * @param {number} baseDamage 
 * @param {string} type 
 * @param {string} style 
 * @param {Array<string>} elements 
 * @param {Object} stepResults 
 * @param {Object} options 
 * @returns {Array<BattleStep>}
 */
function genHitSteps(srcPlayer, targetPlayer, baseDamage, type, style, elements, stepResults = {}, options = {}) {
    if(!style) {
        throw new Error('Missing style param!');
    }

    if(baseDamage <= 0) {
        return [];
    }

    /** @type {Array<BattleStep>} */
    const steps = [];
    baseDamage += srcPlayer.consumeEmpowermentValue(type);

    let power = type === 'magical' ? srcPlayer.getModifiedMagic() : srcPlayer.getModifiedStrength();
    if(options.overrideDamageModifier) {
        power = srcPlayer.getModifiedStat(options.overrideDamageModifier, `${options.overrideDamageModifier}Amp`);
    }
    
    const srcPlayerData = srcPlayer.getData();

    let defense = targetPlayer.getModifiedDefense();
    let defensePen = 0;
    if(options.defensePen) {
        defensePen = options.defensePen;
    }
    defense *= (1 - defensePen);
    // Factor in elemental resistances
    defense *= targetPlayer.getTotalElementalResistance(elements);
    //defense will be at least 0.001
    let damage = chatRPGUtility.calcHitDamge(srcPlayerData.level, baseDamage, power, Math.max(0.001, defense));

    //Weapon Synergy Bonus
    if(srcPlayerData.weapon.style === style) {
        damage *= WEAPON_SYNERGY_BONUS;
    }

    let searchElements = element => elements.find(e => e === element);
    if(Array.isArray(elements)) {
        // Lightning attacking drenched targets bonus
        if(searchElements('lightning') && targetPlayer.getStatusEffect(gameplayObjects.statusEffects.drenched.name)) {
            damage *= 1 + gameplayObjects.statusEffects.drenched.lightningAmp;
        }

        // Elemental burst
        if(elements.length > 1) {
            damage *= ELEMENTAL_BURST_BONUS * (elements.length - 1);
        }
    }

    const damageStep = BattleSteps.damage(targetPlayer, damage, type);
    stepResults.damage = damageStep.damage;
    steps.push(damageStep);

    if(Array.isArray(elements)) {
        const ablazed = gameplayObjects.statusEffects.ablazed;
        const surged = gameplayObjects.statusEffects.surged;
        const drenched = gameplayObjects.statusEffects.drenched;
        const frozen = gameplayObjects.statusEffects.frozen;

        if(elements.length > 1) {
            let infoText = ''; 
            elements.forEach((element, index) => {
                if(elements.length === 2) {    
                    infoText += index === elements.length - 1 ? `and ${element}` : `${element} `;
                }
                else {
                    infoText += index === elements.length - 1 ? `and ${element}` : `${element}, `;
                }
            });

            steps.push(BattleSteps.info(`${srcPlayer.getData().name} combined ${infoText} for an elemental burst!`, 'elementalBurst'));
        }

        if(searchElements('fire')) {
            if(targetPlayer.getStatusEffect(drenched.name)) {
                steps.push(removeStatusEffectStep(drenched, targetPlayer));
            }

            if(chatRPGUtility.chance(ablazed.inflictChance)) {
                const ablazedStep = BattleSteps.gainStatusEffect(ablazed, targetPlayer);
                if(ablazedStep) {
                    steps.push(ablazedStep);
                    stepResults.targetAblazed = true;
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
            if(targetPlayer.getStatusEffect(ablazed.name)) {
                steps.push(BattleSteps.removeStatusEffect(drenched, targetPlayer));
            }

            if(!targetPlayer.getStatusEffect(frozen.name) && damage >= targetPlayer.getData().maxHealth * drenched.healthThreshold) {
                const drenchedStep = BattleSteps.gainStatusEffect(drenched, targetPlayer);
                if(drenchedStep) {
                    steps.push(drenchedStep);
                    stepResults.targetDrenched = true;
                }
            }

            if(srcPlayer.getStatusEffect(ablazed.name)) {
                steps.push(BattleSteps.removeStatusEffect(drenched, srcPlayer));
            }
        }
        if(searchElements('ice')) {
            if(targetPlayer.getStatusEffect(drenched.name) && chatRPGUtility.chance(frozen.drenchedInflict)) {
                steps.push(BattleSteps.removeStatusEffect(drenched, targetPlayer, true));
                steps.push(gainStatusEffectStep(frozen, targetPlayer));
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

    //Apply damage step
    const {totalDamage, protectedDamage} = targetPlayer.dealDamage(netDamage, type);

    const damageStep = {
        type: 'damage',
        targetId: targetPlayerData.id,
        damage: totalDamage,
        protectedDamage: protectedDamage,
        protectedDamageType: type
    };

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

function infoStep(description, action, actorId='', targetId='', animation) {
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
        case  4: {
            return {
                type: ampFunctionName,
                description: `${descBeginning} rose significantly!`
            };
        }
        case -4: {
            return {
                type: ampFunctionName,
                description: `${descBeginning} fell significantly!`
            };
        }
        case  6: {
            return {
                type: ampFunctionName,
                description: `${descBeginning} rose tremendously!`
            };
        }
        case -6: {
            return {
                type: ampFunctionName,
                description: `${descBeginning} fell tremendously!`
            };
        }
        case 12: {
            return {
                type: ampFunctionName,
                description: `${descBeginning} was maximized!`
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

function defenseAmpStep(battlePlayer, stages) {
    return statAmpStep(battlePlayer, 'defense', 'defenseAmp', stages);
}

function magicAmpStep(battlePlayer, stages) {
    return statAmpStep(battlePlayer, 'magic', 'magicAmp', stages);
}

function fireResistAmpStep(battlePlayer, stages) {
    return statAmpStep(battlePlayer, 'fire resistance', 'fireResistAmp', stages);
}

function lightningResistAmpStep(battlePlayer, stages) {
    return statAmpStep(battlePlayer, 'lightning resistance', 'lightningResistAmp', stages);
}

function waterResistAmpStep(battlePlayer, stages) {
    return statAmpStep(battlePlayer, 'water resistance', 'waterResistAmp', stages);
}

function iceResistAmpStep(battlePlayer, stages) {
    return statAmpStep(battlePlayer, 'ice resistance', 'iceResistAmp', stages);
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
    const protectionGained = battlePlayer.addProtection(type, value);
    return {
        type: 'protection',
        targetId: battlePlayer.getData().id,
        protection: {
            type,
            value: protectionGained
        },
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
        targetId: battlePlayer.getData().id,
        apCost: netCost
    };
}

function apGainStep(battlePlayer, apGain) {
    const battlePlayerData = battlePlayer.getData();
    const netGain = Math.min(apGain, battlePlayerData.maxAp - battlePlayerData.ap);
    battlePlayerData.ap += netGain;

    return {
        type: 'apGain',
        targetId: battlePlayer.getData().id,
        apGain: netGain
    };
}

function readyReviveStep(battlePlayer, reviveAmount = 0.5) {
    battlePlayer.getData().autoRevive = reviveAmount;
    return {
        type: 'readyRevive',
        targetId: battlePlayer.getData().id,
        autoRevive: reviveAmount,
        description: `${battlePlayer.getData().name} will be revived if they are defeated.`
    };
}

/**
 * 
 * @param {*} statusEffect 
 * @param {*} targetPlayer 
 * @param {*} refreshEffect 
 * @returns {BattleStep}
 */
function gainStatusEffectStep(statusEffect, targetPlayer, refreshEffect = false) {
    if(!refreshEffect && targetPlayer.getStatusEffect(statusEffect.name)) {
        return infoStep();
    }

    targetPlayer.addStatusEffect(statusEffect.name, statusEffect);
    const step = {
        type: 'gainStatusEffect',
        targetId: targetPlayer.getData().id,
        description: `${targetPlayer.getData().name} is now ${statusEffect.name}!`,
        statusEffect
    };
    return step;
}

/**
 * 
 * @param {*} statusEffect 
 * @param {*} targetPlayer 
 * @param {*} noDescription 
 * @returns {BattleStep}
 */
function removeStatusEffectStep(statusEffect, targetPlayer, noDescription = false) {
    if(!targetPlayer.getStatusEffect(statusEffect.name)) {
        return infoStep();
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
    targetAgent.getData().weapon = weapon.getData();

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
        description: `${targetAgent.getData().name} is ready to defend.`
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

function strikeLevelChangeStep(targetAgent, strikeLevelChange) {
    const oldValue = targetAgent.getData().strikeLevel;
    targetAgent.changeStrikeLevel(strikeLevelChange);

    return {
        type: 'strikeLevelChange',
        targetId: targetAgent.getData().id,
        netChange: targetAgent.getData().strikeLevel - oldValue
    };
}

const BattleSteps = {
    damage: damageStep,
    heal: healStep,
    info: infoStep,
    battleEnd: battleEndStep,
    strengthAmp: strengthAmpStep,
    defenseAmp: defenseAmpStep,
    magicAmp: magicAmpStep,
    fireResistAmp: fireResistAmpStep,
    lightningResistAmp: lightningResistAmpStep,
    waterResistAmp: waterResistAmpStep,
    iceResistAmp: iceResistAmpStep,
    weaponSpeedAmp: weaponSpeedAmpStep,
    empowerment: empowermentStep,
    protection: protectionStep,
    revive: reviveStep,
    apCost: apCostStep,
    apGain: apGainStep,
    readyRevive: readyReviveStep,
    gainStatusEffect: gainStatusEffectStep,
    removeStatusEffect: removeStatusEffectStep,
    imbue: imbueStep,
    removeImbue: removeImbueStep,
    setCounter: setCounterStep,
    addAbility: addAbilityStep,
    removeAbility: removeAblityStep,
    addAbilityStrike: addAbilityStrikeStep,
    strikeLevelChange: strikeLevelChangeStep,
    genHitSteps,
    genStrikeSteps
};

module.exports = BattleSteps;