/**
 * @import {Action} from "./action"
 * @import {BattleStep} from "./battle-steps"
 * @import {DamageStep} from "./battle-steps"
 * @import {BattleContext} from "./battle-context"
 */

const { BattlePlayer } = require("../datastore-objects/battle-agent");
const { calcTrueDamage } = require("../utility");
const BattleSteps = require("./battle-steps");
const { findBattleStep } = require("./utility");
const { PlayerActionType } = require('./action');
const { createEffect } = require("./effects/effects");

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
    if(action.playerAction) {
        const playerAction = action.playerAction;
        if(playerAction.baseDamage && playerAction.srcPlayer && playerAction.type && playerAction.style) {
            const hitSteps = BattleSteps.genHitSteps(playerAction.srcPlayer,
                playerAction.targetPlayer,
                playerAction.baseDamage,
                playerAction.type, playerAction.style, playerAction.elements, battleContext, {defensePen: playerAction.defensePen})
            steps.push(...hitSteps);
            
            const damageStep = /**@type {DamageStep}*/(findBattleStep('damage', hitSteps));
            if(playerAction.absorb && playerAction.absorb > 0 && damageStep.damage > 0) {
                const absorbStep = BattleSteps.heal(playerAction.srcPlayer, damageStep.damage * playerAction.absorb);
                steps.push(absorbStep);
                steps.push(BattleSteps.info(`${playerAction.srcPlayer.getData().name} absorbed ${playerAction.targetPlayer.getData().name}'s health.`, 'absorb', playerAction.srcPlayer.getData().id, playerAction.targetPlayer.getData().id))
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

        if(playerAction.revive) {
            const reviveStep = BattleSteps.revive(playerAction.targetPlayer, playerAction.revive);
            steps.push(reviveStep);
        }

        if(playerAction.strikeLevelChange) {
            const strikeLevelChangeStep = BattleSteps.strikeLevelChange(playerAction.targetPlayer, playerAction.strikeLevelChange);
            steps.push(strikeLevelChangeStep);
        }

        if(playerAction.apChange) {
            const apChangeStep = BattleSteps.apChange(playerAction.targetPlayer, playerAction.apChange);
            steps.push(apChangeStep);
        }

        if(playerAction.consumeItem) {
            const consumeItemStep = BattleSteps.consumeItem(/** @type {BattlePlayer} */(playerAction.targetPlayer), playerAction.consumeItem);
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

        if(playerAction.defenseAmp) {
            const defenceAmpStep = BattleSteps.defenseAmp(playerAction.targetPlayer, playerAction.defenseAmp);
            steps.push(defenceAmpStep);
        }

        if(playerAction.strengthAmp) {
            const defenceAmpStep = BattleSteps.strengthAmp(playerAction.targetPlayer, playerAction.strengthAmp);
            steps.push(defenceAmpStep);
        }

        if(playerAction.weaponSpeedAmp) {
            const weaponSpeedAmpStep = BattleSteps.weaponSpeedAmp(playerAction.targetPlayer, playerAction.weaponSpeedAmp);
            steps.push(weaponSpeedAmpStep);
        }

        if(playerAction.lightningResistAmp) {
            const lightningResistAmpStep = BattleSteps.lightningResistAmp(playerAction.targetPlayer, playerAction.lightningResistAmp);
            steps.push(lightningResistAmpStep);
        }

    }

    if(action.infoAction) {
        const infoActionData = action.infoAction;
        const infoAction = BattleSteps.info(infoActionData.description, action.infoAction.action, infoActionData.srcAgentId, infoActionData.targetAgentId, infoActionData.animation);
        steps.push(infoAction);
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
    return steps;
}

const ActionExecutor = {
    execute: executeAction
}

module.exports = {ActionExecutor};
