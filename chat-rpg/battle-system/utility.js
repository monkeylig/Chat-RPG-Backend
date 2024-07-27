/**
 * @import {Action} from "./action"
 * @import {BattleStep} from "./battle-steps"
 * @import {BattleContext} from "./battle-context"
 * @import {AbilityActionData} from "../datastore-objects/ability"
 */

const { BattleAgent } = require("../datastore-objects/battle-agent");

/**
 * 
 * @param {BattleAgent} user 
 * @param {string} targetStr 
 * @param {BattleContext} battleContext 
 * @returns {BattleAgent}
 */
function getTarget(user, targetStr, battleContext) {
    const target = targetStr === 'opponent' ? battleContext.getOpponent(user) : user;
    if (!target) {
        return user;
    }

    return target;
}

/** 
 * @param {string} type
 * @param {BattleStep[]} battleSteps 
 * @returns {BattleStep|undefined}
 */
function findBattleStep(type, battleSteps) {
    return battleSteps.find((step) => {return step.type === type});
}

/**
 * 
 * @param {string} element 
 * @param {string[]} [elements] 
 * @returns {string | undefined}
 */
function findElement(element, elements) {
    if (elements) {
        return elements.find((_element) => element === _element);
    }
}

/**
 * 
 * @param {BattleAgent} user 
 * @param {AbilityActionData} actionData 
 * @param {BattleContext} battleContext 
 * @param {Object} [options={}] 
 * @returns {Generator<Action, void, any>}
 */
function *generateStandardActions(user, actionData, battleContext, options = {}) {
    let target = getTarget(user, actionData.target, battleContext);

    /**@type {Action} */
    const action = {
        playerAction: {
            baseDamage: actionData.baseDamage,
            trueDamage: actionData.trueDamage,
            defensePen: actionData.defensePen,
            elements: actionData.elements,
            targetPlayer: target,
            srcPlayer: user,
            style: actionData.style,
            type: actionData.type,
            apChange: actionData.apChange,
            absorb: actionData.absorb,
            protection: actionData.protection,
            defenseAmp: actionData.defenseAmp,
            strengthAmp: actionData.strengthAmp,
            lightningResistAmp: actionData.lightningResistAmp
        },
    };

    if(actionData.empowerment) {
        let type;
        let damageIncrease;
        if (actionData.empowerment.magical) {
            type = 'magical';
            damageIncrease = actionData.empowerment.magical;
        }

        if (actionData.empowerment.physical) {
            type = 'physical';
            damageIncrease = actionData.empowerment.physical;
        }

        if (type && damageIncrease) {
            action.battleContextAction = {
                addEffect: {
                    targetId: target.getData().id,
                    className: 'EmpowermentEffect',
                    inputData: {damageIncrease, type}
                }
            };
        }


    }

    if (actionData.addEffect) {
        const addEffectData = actionData.addEffect;
        action.battleContextAction = {
            addEffect: {
                className: addEffectData.class,
                targetId: target.getData().id,
                inputData: addEffectData.inputData ? addEffectData.inputData : {}
            }
        };
    }
    yield action;
}

module.exports = {getTarget, findBattleStep, findElement, generateStandardActions}
