/**
 * @import {Action} from "./action"
 * @import {BattleStep} from "./battle-steps"
 * @import {DamageStep} from "./battle-steps"
 * @import {BattleContext} from "./battle-context"
 */

const { BattlePlayer } = require("../datastore-objects/battle-agent");
const { chance } = require("../utility");
const BattleSteps = require("./battle-steps");
const { findBattleStep, calcTrueDamage } = require("./utility");
const { PlayerActionType } = require('./action');
const { createEffect } = require("./effects/effects");
const { dodge } = require("../content/animations");

/**
 * Executes an action that will have side effects on game objects.
 * 
 * @param {Action} action - The action to execute
 * @param {BattleContext} battleContext 
 * @returns {Array<BattleStep>} Battle steps that describe what the action did
 */
function executeAction(action, battleContext) {
    if(!action) {
        return []
    }

    const steps = [];
    //Animations come first
    if(action.infoAction && action.infoAction.animation) {
        const infoActionData = action.infoAction;
        const infoAction = BattleSteps.info('', action.infoAction.action, infoActionData.srcAgentId, infoActionData.targetAgentId, infoActionData.animation);
        steps.push(infoAction);
    }

    if(action.playerAction) {
        const playerAction = action.playerAction;
        if(playerAction.baseDamage && playerAction.srcPlayer && playerAction.type && playerAction.style) {
            const targetAgentData = playerAction.targetPlayer.getData();
            if (chance(targetAgentData.evasion) && process.env.NODE_ENV !== 'test') {
                return [BattleSteps.info(`${targetAgentData.name} dodged an attack.`, 'dodge', targetAgentData.id, targetAgentData.id, dodge)];
            }

            const hitSteps = BattleSteps.genHitSteps(playerAction.srcPlayer,
                playerAction.targetPlayer,
                playerAction.baseDamage,
                playerAction.type, playerAction.style, playerAction.elements, battleContext, {
                    defensePen: playerAction.defensePen,
                    baseDamageChange: playerAction.baseDamageChange,
                    overrideDamageModifier: playerAction.overrideDamageModifier
                });
                
            steps.push(...hitSteps);
            
            const damageStep = /**@type {DamageStep}*/(findBattleStep('damage', hitSteps));

            if(damageStep.damage > 0) {
                if(playerAction.absorb && playerAction.absorb > 0) {
                    const absorbStep = BattleSteps.heal(playerAction.srcPlayer, damageStep.damage * playerAction.absorb);
                    steps.push(absorbStep);
                    steps.push(BattleSteps.info(`${playerAction.srcPlayer.getData().name} absorbed ${playerAction.targetPlayer.getData().name}'s health.`, 'absorb', playerAction.srcPlayer.getData().id, playerAction.targetPlayer.getData().id));
                }
    
                if(playerAction.recoil && playerAction.recoil > 0) {
                    const recoilStep = BattleSteps.damage(playerAction.srcPlayer, damageStep.damage * playerAction.recoil, playerAction.type);
                    steps.push(recoilStep);
                    const id = playerAction.srcPlayer.getData().id;
                    steps.push(BattleSteps.info(`${playerAction.srcPlayer.getData().name} was hurt by the recoil.`, 'recoil', id, id));
                }
            }
        }

        if(playerAction.trueDamage && playerAction.type) {
            const damage = calcTrueDamage(playerAction.trueDamage, playerAction.targetPlayer.getData().level);
            const damageStep = BattleSteps.damage(playerAction.targetPlayer, damage, playerAction.type);
            steps.push(damageStep);
        }

        if(playerAction.heal) {
            const healStep = BattleSteps.heal(playerAction.targetPlayer, playerAction.heal);
            steps.push(healStep);
        }

        if(playerAction.healPercent) {
            const healStep = BattleSteps.heal(playerAction.targetPlayer, playerAction.targetPlayer.getData().maxHealth * playerAction.healPercent);
            steps.push(healStep);
        }

        if(playerAction.revive) {
            const reviveStep = BattleSteps.revive(playerAction.targetPlayer, playerAction.revive);
            steps.push(reviveStep);
        }

        if(playerAction.strikeLevelChange) {
            const strikeLevelChangeStep = BattleSteps.strikeLevelChange(playerAction.targetPlayer, playerAction.strikeLevelChange);
            steps.push(strikeLevelChangeStep);
        }

        if(playerAction.maxApChange) {
            const apChangeStep = BattleSteps.maxApChange(playerAction.targetPlayer, playerAction.maxApChange);
            steps.push(apChangeStep);
        }

        if(playerAction.apChange) {
            const apChangeStep = BattleSteps.apChange(playerAction.targetPlayer, playerAction.apChange);
            steps.push(apChangeStep);
        }

        if(playerAction.consumeItem) {
            const consumeItemStep = BattleSteps.consumeItem(/** @type {BattlePlayer} */(playerAction.targetPlayer), playerAction.consumeItem.name, playerAction.consumeItem.location);
            steps.push(consumeItemStep);
        }

        if(playerAction.protection && (playerAction.protection.magical || playerAction.protection.physical)) {
            let protectionType = PlayerActionType.Physical;
            if (playerAction.protection.magical) {
                protectionType = PlayerActionType.Magical
            }
            const protectionStep = BattleSteps.protection(playerAction.targetPlayer, protectionType, playerAction.protection[protectionType]);
            steps.push(protectionStep);
        }

        if(playerAction.addAbility) {
            const addAbilityStep = BattleSteps.addAbility(playerAction.targetPlayer, playerAction.addAbility);
            steps.push(addAbilityStep);
        }

        if(playerAction.removeAbility) {
            const removeAbilityStep = BattleSteps.removeAbility(playerAction.targetPlayer, playerAction.removeAbility);
            steps.push(removeAbilityStep);
        }

        if(playerAction.defenseAmp) {
            const defenceAmpStep = BattleSteps.defenseAmp(playerAction.targetPlayer, playerAction.defenseAmp);
            steps.push(defenceAmpStep);
        }

        if(playerAction.strengthAmp) {
            const strengthAmpStep = BattleSteps.strengthAmp(playerAction.targetPlayer, playerAction.strengthAmp);
            steps.push(strengthAmpStep);
        }

        if(playerAction.magicAmp) {
            const magicAmpStep = BattleSteps.magicAmp(playerAction.targetPlayer, playerAction.magicAmp);
            steps.push(magicAmpStep);
        }

        if(playerAction.weaponSpeedAmp) {
            const weaponSpeedAmpStep = BattleSteps.weaponSpeedAmp(playerAction.targetPlayer, playerAction.weaponSpeedAmp);
            steps.push(weaponSpeedAmpStep);
        }

        if(playerAction.lightningResistAmp) {
            const lightningResistAmpStep = BattleSteps.lightningResistAmp(playerAction.targetPlayer, playerAction.lightningResistAmp);
            steps.push(lightningResistAmpStep);
        }

        if(playerAction.fireResistAmp) {
            const fireResistAmpStep = BattleSteps.fireResistAmp(playerAction.targetPlayer, playerAction.fireResistAmp);
            steps.push(fireResistAmpStep);
        }

        if(playerAction.waterResistAmp) {
            const waterResistAmpStep = BattleSteps.waterResistAmp(playerAction.targetPlayer, playerAction.waterResistAmp);
            steps.push(waterResistAmpStep);
        }

        if(playerAction.iceResistAmp) {
            const iceResistAmpStep = BattleSteps.iceResistAmp(playerAction.targetPlayer, playerAction.iceResistAmp);
            steps.push(iceResistAmpStep);
        }
    }

    if(action.battleContextAction) {
        const battleContextAction = action.battleContextAction;
        if(battleContextAction.addEffect) {
            const addEffect = battleContextAction.addEffect;
            const target = battleContext.findAgentById(addEffect.targetId);
            if (target) {
                const newEffect = createEffect(addEffect.className, addEffect.inputData, target);
                if (newEffect) {
                    const addEffectStep = BattleSteps.addEffect(battleContext, newEffect);
                    steps.push(addEffectStep);
                }
            }
        }

        if(battleContextAction.removeEffect) {
            const removeEffectStep = BattleSteps.removeEffect(battleContext, battleContextAction.removeEffect);
            steps.push(removeEffectStep);
        }

        if(battleContextAction.removeActionGenerator && battleContextAction.targetId) {
            const removeActionGeneratorStep = BattleSteps.removeActionGenerator(battleContext, battleContextAction.removeActionGenerator, battleContextAction.targetId, battleContextAction.action);
            steps.push(removeActionGeneratorStep);
        }

        if(battleContextAction.triggerAbility) {
            const triggerAbility = battleContextAction.triggerAbility;
            const triggerAbilityStep = BattleSteps.triggerAbility(battleContext, triggerAbility.ability, triggerAbility.user);
            steps.push(triggerAbilityStep);
        }
    }

    if (action.actionGeneratorAction) {
        const aGAction = action.actionGeneratorAction;
        const actionGenStep = BattleSteps.actionGeneratorDataMod(aGAction.targetActionGenerator, aGAction.modFunction, aGAction.targetId, aGAction.action, aGAction.description);
        steps.push(actionGenStep);
    }

    if (action.actionModAction) {
        const actionModAction = action.actionModAction;
        const actionModStep = BattleSteps.actionMod(actionModAction.targetAction, actionModAction.modFunction, actionModAction.targetId, actionModAction.action, actionModAction.description);
        steps.push(actionModStep);
    }

    // Text info comes last
    if(action.infoAction && action.infoAction.description) {
        const infoActionData = action.infoAction;
        const infoAction = BattleSteps.info(infoActionData.description, action.infoAction.action, infoActionData.srcAgentId, infoActionData.targetAgentId);
        steps.push(infoAction);
    }
    return steps;
}

const ActionExecutor = {
    execute: executeAction
}

module.exports = {ActionExecutor};
