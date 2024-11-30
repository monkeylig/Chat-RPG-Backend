/**
 * @import {BattleContext} from './battle-context'
 * @import {BattleData} from '../datastore-objects/battle'
 * @import {ActionGenerator} from './action-generator'
 * @import {Effect, EffectData} from './effect'
 * @import {Action, ActionGeneratorModFunction, PlayerActionType} from './action'
 * @import {GConstructor} from '../utility'
 * @import {ProtectionData} from './action'
 * @import {AbilityData} from '../datastore-objects/ability'
 */

const { BattleWeapon, BattleAgent, BattlePlayer } = require('../datastore-objects/battle-agent');
const gameplayObjects = require('../gameplay-objects');
const chatRPGUtility = require('../utility');
const { AblazedEffect } = require('./effects/ablazed-effect');
const {ElementsEnum} = require('./action');
const { SurgedEffect } = require('./effects/surged-effect');
const { DrenchedEffect } = require('./effects/drenched-effect');
const { AbilityBattleMove } = require('./ability-battle-move');
const { calcHitDamage } = require('./utility');

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
 * @param {Array<string>|undefined|null} elements 
 * @param {BattleContext} battleContext 
 * @param {{
 * defensePen?: number,
 * baseDamageChange?: number,
 * overrideDamageModifier?: string
 * }} options 
 * @returns {Array<BattleStep>}
 */
function genHitSteps(srcPlayer, targetPlayer, baseDamage, type, style, elements, battleContext, options = {}) {
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
    let damage = calcHitDamage(srcPlayerData.level, baseDamage, power, Math.max(0.001, defense));

    let baseDamageChange = 1;

    if (options.baseDamageChange !== undefined) {
        baseDamageChange += options.baseDamageChange;
    }

    //Weapon Synergy Bonus
    if(srcPlayerData.weapon.style === style) {
        baseDamageChange *= WEAPON_SYNERGY_BONUS;
    }

    let searchElements = elements ? element => elements.find(e => e === element) : (elements) => undefined;
    if(elements) {
        // Elemental burst
        if(elements.length > 1) {
            baseDamageChange *= ELEMENTAL_BURST_BONUS * (elements.length - 1);
        }
    }

    damage *= baseDamageChange;
    const damageStep = BattleSteps.damage(targetPlayer, damage, type);
    steps.push(damageStep);

    if(elements) {
        const ablazed = gameplayObjects.statusEffects.ablazed;
        const surged = gameplayObjects.statusEffects.surged;
        const drenched = gameplayObjects.statusEffects.drenched;

        /**
         * @param {GConstructor<Effect>} InflictEffect
         * @param {Object} inputData
         */
        const inflict = (InflictEffect, inputData) => {
            const inflictEffect = new InflictEffect(targetPlayer, inputData);
            steps.push(addEffect(battleContext, inflictEffect));
        };
        if(searchElements(ElementsEnum.Fire) && !battleContext.getEffectCount('DrenchedEffect', targetPlayer)) {
            if(chatRPGUtility.chance(ablazed.inflictChance)) {
                inflict(AblazedEffect, {trueDamage: ablazed.trueDamage, roundsLeft: ablazed.roundsLeft});
            }
        }
        else if(searchElements(ElementsEnum.Lightning)) {
            if(chatRPGUtility.chance(surged.inflictChance)) {
                inflict(SurgedEffect, {trueDamage: surged.trueDamage, roundsLeft: surged.roundsLeft});
            }
        }
        else if(searchElements(ElementsEnum.Water) && !battleContext.getEffectCount('AblazedEffect', targetPlayer)) {
            if (damage >= targetPlayer.getData().maxHealth * drenched.healthThreshold) {
                inflict(DrenchedEffect, {trueDamage: drenched.trueDamage, roundsLeft: drenched.roundsLeft});
            }
        }
    }

    return steps;
}

/**
 * @typedef {BattleStep & {
 * targetId: string,
 * damage: number,
 * protectedDamage: number,
 * protectedDamageType?: string
 * }} DamageStep
 * 
 * @param {BattleAgent} targetPlayer 
 * @param {number} damage 
 * @param {string} type
 * @returns {DamageStep}
 */
function damageStep(targetPlayer, damage, type) {
    const netDamage = damage;
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

/**
 * @typedef {BattleStep & {
 * targetId: string,
 * healAmount: number
 * }} HealStep
 * 
 * @param {BattleAgent} targetPlayer 
 * @param {number} healAmount 
 * @returns {HealStep}
 */
function healStep(targetPlayer, healAmount) {
    const targetPlayerData = targetPlayer.getData();
    const healStep = {
        type: 'heal',
        targetId: targetPlayerData.id,
        healAmount: 0
    };

    healStep.healAmount = targetPlayer.heal(healAmount);

    return healStep;
}

/**
 * @typedef {BattleStep & {
 * action?: string,
 * actorId?: string,
 * targetId?: string,
 * animation?: object
 * }} InfoBattleStep
 * 
 * @param {string} description A description of an action that took place
 * @param {string} [action] A short subject line for the action
 * @param {string} [actorId] The id the of the battle agent that performed this action 
 * @param {string} [targetId] The id of the target of the action
 * @param {Object} [animation] Animation information to show a visual representation of the action
 * @returns {InfoBattleStep}
 */
function infoStep(description='', action, actorId='', targetId='', animation=undefined) {
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

/**
 * @typedef {BattleStep & {
 * status: string,
 * winner: string | null
 * }} BattleEndStep
 * 
 * @param {BattleData} battleData
 * @param {string} status
 * @param {string | null} winnerId
 * @param {string} [description]
 * @returns {BattleEndStep}
 */
function battleEnd(battleData, status, winnerId, description) {
    battleData.active = false;
    battleData.result = {
        status: status,
        winner: winnerId,
        expAward: 0,
        levelGain: 0,
        drops: []
    };
    
    return {
        type: 'battleEnd',
        status: status, 
        winner: winnerId,
        description
    };
}

/**
 * @typedef {BattleStep & {
 * ampAmount: number,
 * targetId: string
 * }} StatAmpStep
 * 
 * @param {BattleAgent} battlePlayer 
 * @param {string} stat 
 * @param {string} ampFunctionName 
 * @param {number} stages 
 * @param {string} [prefix]
 * @returns {StatAmpStep}
 */
function statAmpStep(battlePlayer, stat, ampFunctionName, stages, prefix) {

    let descBeginning = `${battlePlayer.getData().name}'s ${stat}`;
    if(prefix) {
        descBeginning = prefix;
    }

    const ampAmount = battlePlayer[ampFunctionName](stages);
    switch(ampAmount) {
        case 0: {
            if (stages > 0) {
                return {
                    type: ampFunctionName,
                    targetId: battlePlayer.getData().id,
                    description: `${descBeginning} is maximized.`,
                    ampAmount
                };
            } else {
                return {
                    type: ampFunctionName,
                    targetId: battlePlayer.getData().id,
                    description: `${descBeginning} can't fall any lower.`,
                    ampAmount
                };
            }
        }
        case 1: {
            return {
                type: ampFunctionName,
                targetId: battlePlayer.getData().id,
                description: `${descBeginning} rose slightly.`,
                ampAmount
            };
        }
        case -1: {
            return {
                type: ampFunctionName,
                targetId: battlePlayer.getData().id,
                description: `${descBeginning} fell slightly.`,
                ampAmount
            };
        }
        case 3: {
            return {
                type: ampFunctionName,
                targetId: battlePlayer.getData().id,
                description: `${descBeginning} rose suddenly!`,
                ampAmount
            };
        }
        case -3: {
            return {
                type: ampFunctionName,
                targetId: battlePlayer.getData().id,
                description: `${descBeginning} fell suddenly!`,
                ampAmount
            };
        }
        case  4: {
            return {
                type: ampFunctionName,
                targetId: battlePlayer.getData().id,
                description: `${descBeginning} rose significantly!`,
                ampAmount
            };
        }
        case -4: {
            return {
                type: ampFunctionName,
                targetId: battlePlayer.getData().id,
                description: `${descBeginning} fell significantly!`,
                ampAmount
            };
        }
        case  6: {
            return {
                type: ampFunctionName,
                targetId: battlePlayer.getData().id,
                description: `${descBeginning} rose tremendously!`,
                ampAmount
            };
        }
        case -6: {
            return {
                type: ampFunctionName,
                targetId: battlePlayer.getData().id,
                description: `${descBeginning} fell tremendously!`,
                ampAmount
            };
        }
        case 12: {
            return {
                type: ampFunctionName,
                targetId: battlePlayer.getData().id,
                description: `${descBeginning} was maximized!`,
                ampAmount
            };
        }
        case 2:
        default: {
            return {
                type: ampFunctionName,
                targetId: battlePlayer.getData().id,
                description: stages > 0 ? `${descBeginning} rose!` : `${descBeginning} fell.`,
                ampAmount
            };
        }
    }
}

/**
 * 
 * @param {BattleAgent} battlePlayer 
 * @param {number} stages 
 * @returns {StatAmpStep}
 */
function strengthAmpStep(battlePlayer, stages) {
    return statAmpStep(battlePlayer, 'strength', 'strengthAmp', stages);
}

/**
 * 
 * @param {BattleAgent} battlePlayer 
 * @param {number} stages 
 * @returns {StatAmpStep}
 */
function defenseAmpStep(battlePlayer, stages) {
    return statAmpStep(battlePlayer, 'defense', 'defenseAmp', stages);
}

/**
 * 
 * @param {BattleAgent} battlePlayer 
 * @param {number} stages 
 * @returns {StatAmpStep}
 */
function magicAmpStep(battlePlayer, stages) {
    return statAmpStep(battlePlayer, 'magic', 'magicAmp', stages);
}

/**
 * 
 * @param {BattleAgent} battlePlayer 
 * @param {number} stages 
 * @returns {StatAmpStep}
 */
function fireResistAmpStep(battlePlayer, stages) {
    return statAmpStep(battlePlayer, 'fire resistance', 'fireResistAmp', stages);
}

/**
 * 
 * @param {BattleAgent} battlePlayer 
 * @param {number} stages 
 * @returns {StatAmpStep}
 */
function lightningResistAmpStep(battlePlayer, stages) {
    return statAmpStep(battlePlayer, 'lightning resistance', 'lightningResistAmp', stages);
}

/**
 * 
 * @param {BattleAgent} battlePlayer 
 * @param {number} stages 
 * @returns {StatAmpStep}
 */
function waterResistAmpStep(battlePlayer, stages) {
    return statAmpStep(battlePlayer, 'water resistance', 'waterResistAmp', stages);
}

/**
 * 
 * @param {BattleAgent} battlePlayer 
 * @param {number} stages 
 * @returns {StatAmpStep}
 */
function iceResistAmpStep(battlePlayer, stages) {
    return statAmpStep(battlePlayer, 'ice resistance', 'iceResistAmp', stages);
}

function weaponSpeedAmpStep(battlePlayer, stages) {
    const weapon = new BattleWeapon(battlePlayer.getData().weapon);
    // @ts-ignore TODO: Make Specific speed amp function
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

/**
 * @typedef {BattleStep & {
 * targetId: string,
 * protection: ProtectionData
 * }} ProtectionStep
 * 
 * @param {BattleAgent} battlePlayer 
 * @param {PlayerActionType} type 
 * @param {number} value 
 * @returns {ProtectionStep}
 */
function protection(battlePlayer, type, value) {
    const protectionGained = battlePlayer.addProtection(type, value);
    return {
        type: 'protection',
        targetId: battlePlayer.getData().id,
        protection: {
            [type]:protectionGained 
        },
        description: `${battlePlayer.getData().name} gained ${value}% ${type} protection!`
    };
}

/**
 * @typedef {BattleStep & {
 * targetId: string,
 * healAmount: number
 * }} ReviveStep
 * 
 * @param {BattleAgent} targetAgent 
 * @param {number} healPercent
 * @returns {ReviveStep}
 */
function reviveStep(targetAgent, healPercent) {
    const healAmount = targetAgent.revive(healPercent);

    return {
        type: 'revive',
        targetId: targetAgent.getData().id,
        healAmount: healAmount,
        description: healAmount ? `${targetAgent.getData().name} was revived!` : `${targetAgent.getData().name} is not defeated.`
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

/**
 * @typedef {BattleStep & {
 * targetId: string,
 * netChange: number
 * }} SApChangeBattleStep
 * 
 * @param {BattleAgent} battleAgent 
 * @param {number} value 
 * @returns {SApChangeBattleStep}
 */
function apChange(battleAgent, value) {
    const battlePlayerData = battleAgent.getData();
    const netChange = Math.min(battlePlayerData.maxAp - battlePlayerData.ap, Math.max(value, -battlePlayerData.ap));
    battlePlayerData.ap += netChange;

    return {
        type: 'apChange',
        targetId: battleAgent.getData().id,
        netChange: netChange
    };

}

/**
 * @typedef {BattleStep & {
* targetId: string,
* netChange: number
* }} MaxApChangeStep
* 
* @param {BattleAgent} battleAgent 
* @param {number} value 
* @returns {MaxApChangeStep}
*/
function maxApChange(battleAgent, value) {
    const battlePlayerData = battleAgent.getData();
    const netChange =  Math.max(value, -battlePlayerData.maxAp);
    battlePlayerData.maxAp += netChange;

    return {
        type: 'maxApChange',
        targetId: battleAgent.getData().id,
        netChange: netChange
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

/**
 * @typedef {BattleStep & {
 * ability: AbilityData,
 * targetId: string,
 * successful: boolean
 * }} AddAbilityStep
 * 
 * @param {BattleAgent} targetAgent 
 * @param {AbilityData} ability 
 * @returns {AddAbilityStep}
 */
function addAbility(targetAgent, ability) {
    const successful = targetAgent.addAbility(ability);

    return {
        type: 'addAbility',
        ability: ability,
        targetId: targetAgent.getData().id,
        successful
    };
}

/**
 * @typedef {BattleStep & {
 * targetId: string,
 * ability?: AbilityData,
 * successful: boolean
 * }} RemoveAbilityStep
 * 
 * @param {BattleAgent} targetAgent 
 * @param {string} abilityName 
 * @returns {RemoveAbilityStep}
 */
function removeAbility(targetAgent, abilityName) {
    const abilityData = targetAgent.removeAbility(abilityName);

    return {
        type: 'removeAbility',
        targetId: targetAgent.getData().id,
        ability: abilityData,
        successful: abilityData !== undefined
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

/**
 * @typedef {BattleStep & {
 * targetId: string,
 * netChange: number
 * }} SStrikeLevelChangeStep
 * 
 * @param {BattleAgent} targetAgent 
 * @param {number} strikeLevelChange 
 * @returns {SStrikeLevelChangeStep}
 */
function strikeLevelChangeStep(targetAgent, strikeLevelChange) {
    const oldValue = targetAgent.getData().strikeLevel;
    targetAgent.changeStrikeLevel(strikeLevelChange);

    return {
        type: 'strikeLevelChange',
        targetId: targetAgent.getData().id,
        netChange: targetAgent.getData().strikeLevel - oldValue
    };
}

/**
 * @typedef {BattleStep & {
 * targetId: string,
 * itemName: string,
 * successful: boolean,
 * itemDepleted: boolean,
 * }} ConsumeItemStep
 * 
 * @param {BattlePlayer} targetAgent 
 * @param {string} itemName 
 * @returns {ConsumeItemStep}
 */
function consumeItem(targetAgent, itemName) {
    const item = targetAgent.consumeItem(itemName);
    return {
        type: 'consumeItem',
        targetId: targetAgent.getData().id,
        itemName: itemName,
        successful: item !== undefined,
        itemDepleted: (item !== undefined && item.isDepleted())
    };
}

/**
 * @typedef {BattleStep & {
 * successful: boolean,
 * effect: EffectData
 * }} AddEffectStep
 * 
 * @param {BattleContext} battleContext 
 * @param {Effect} effect 
 * @returns {AddEffectStep}
 */
function addEffect(battleContext, effect) {
    const step = {
        type: 'addEffect',
        successful: false,
        effect: effect.getData()
    };
    if (effect.unique && battleContext.getEffectCount(effect.className, effect.targetPlayer) > 0 || battleContext.isEffectActive(effect)) {
        return step;
    }

    battleContext.addEffect(effect);

    if (effect.persistentId && effect.persistentId != '') {
        effect.targetPlayer.setEffect(effect.getData());
    }

    step.successful = true;
    return step;
}

/**
 * @typedef {AddEffectStep} RemoveEffectStep
 * 
 * @param {BattleContext} battleContext 
 * @param {Effect} effect 
 * @returns {RemoveEffectStep}
 */
function removeEffect(battleContext, effect) {
    const step = {
        type: 'removeEffect',
        successful: false,
        effect: effect.getData()
    };
    if (!battleContext.isEffectActive(effect)) {
        return step;
    }

    battleContext.removeEffect(effect);

    if (effect.persistentId && effect.persistentId != '') {
        effect.targetPlayer.removeEffect(effect.persistentId);
    }

    step.successful = true;
    return step;
}

/**
 * @typedef {BattleStep & {
 * action: string,
 * targetId: string
 * }} ActionGeneratorDataModStep
 *  
 * @param {ActionGenerator} actionGenerator 
 * @param {ActionGeneratorModFunction} modFunction 
 * @param {string} targetId
 * @param {string} [action]
 * @param {string} [description] 
 * @returns {ActionGeneratorDataModStep}
 */
function actionGeneratorDataMod(actionGenerator, modFunction, targetId, action, description) {
    modFunction(actionGenerator.inputData);

    return {
        type: 'actionGenMod',
        action: action ? action : 'actionMod',
        targetId,
        description
    };
}

/**
 * @typedef {ActionGeneratorDataModStep} ActionDataModStep
 * 
 * @param {Action} targetAction 
 * @param {ActionGeneratorModFunction} modFunction 
 * @param {string} targetId 
 * @param {string} action 
 * @param {string} [description] 
 * @returns {ActionDataModStep}
 */
function actionMod(targetAction, modFunction, targetId, action, description) {
    modFunction(targetAction);

    return {
        type: 'actionMod',
        action: action ? action : 'actionMod',
        targetId,
        description
    };
}

/**
 * @typedef {BattleStep & {
 * successful: boolean,
 * action: string,
 * targetId: string
 * }} RemoveActionGeneratorStep
 * 
 * @param {BattleContext} battleContext 
 * @param {ActionGenerator} actionGenerator 
 * @param {string} targetId
 * @param {string} [action] 
 * @returns {RemoveActionGeneratorStep}
 */
function removeActionGenerator(battleContext, actionGenerator, targetId, action) {
    const actionGen = battleContext.removeActionGenerator(actionGenerator);
    
    return {
        type: 'removeActionGenerator',
        successful: actionGen ? true : false,
        action: action ? action : 'negate',
        targetId
    };
}

/**
 * 
 * @param {BattleContext} battleContext 
 * @param {AbilityData} ability 
 * @param {BattleAgent} srcPlayer 
 */
function triggerAbility(battleContext, ability, srcPlayer) {
    const abilityMove = new AbilityBattleMove(srcPlayer, ability);
    battleContext.activateBattleMove(abilityMove);
    return {
        type: 'triggerAbility',
        ability
    }
}

const BattleSteps = {
    damage: damageStep,
    heal: healStep,
    info: infoStep,
    battleEnd,
    strengthAmp: strengthAmpStep,
    defenseAmp: defenseAmpStep,
    magicAmp: magicAmpStep,
    fireResistAmp: fireResistAmpStep,
    lightningResistAmp: lightningResistAmpStep,
    waterResistAmp: waterResistAmpStep,
    iceResistAmp: iceResistAmpStep,
    weaponSpeedAmp: weaponSpeedAmpStep,
    empowerment: empowermentStep,
    protection,
    revive: reviveStep,
    apCost: apCostStep,
    apGain: apGainStep,
    apChange,
    maxApChange,
    readyRevive: readyReviveStep,
    gainStatusEffect: gainStatusEffectStep,
    removeStatusEffect: removeStatusEffectStep,
    imbue: imbueStep,
    removeImbue: removeImbueStep,
    setCounter: setCounterStep,
    addAbility,
    removeAbility,
    addAbilityStrike: addAbilityStrikeStep,
    strikeLevelChange: strikeLevelChangeStep,
    consumeItem,
    addEffect,
    removeEffect,
    actionGeneratorDataMod,
    actionMod,
    genHitSteps,
    removeActionGenerator,
    triggerAbility,
};

module.exports = BattleSteps;