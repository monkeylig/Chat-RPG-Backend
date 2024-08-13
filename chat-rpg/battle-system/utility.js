/**
 * @import {Action} from "./action"
 * @import {BattleStep} from "./battle-steps"
 * @import {BattleContext} from "./battle-context"
 * @import {AbilityActionData} from "../datastore-objects/ability"
 * @import {BattleAgent} from "../datastore-objects/battle-agent"
 * @import {ActionGeneratorCreator} from "./battle-system-types"
 */

const { GeneratorCreatorType } = require("./battle-system-types");

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
 * @typedef {Object} ActionFilter
 * @property {string[]} [elements]
 * @property {BattleAgent} [targetAgent]
 * @property {BattleAgent} [srcAgent]
 * @property {boolean} [isAttack]
 * @property {string} [style]
 * 
 * @param {Action} action 
 * @param {ActionFilter} [actionFilter]
 * @returns {boolean} 
 */
function matchPlayerAction(action, actionFilter) {
    const playerAction = action.playerAction;
    if (!playerAction) {
        return false;  
    }

    if(actionFilter) {
        if (actionFilter.isAttack !== undefined) {
            if (actionFilter.isAttack && !playerAction.baseDamage) {
                return false;
            }
            else if (!actionFilter.isAttack && playerAction.baseDamage) {
                return false;
            }
        }
    
        if (actionFilter.targetAgent && actionFilter.targetAgent !== playerAction.targetPlayer) {
            return false;
        }

        if (actionFilter.srcAgent && actionFilter.srcAgent !== playerAction.srcPlayer) {
            return false;
        } 
        
        if (actionFilter.elements) {
            if (!playerAction.elements) {
                return false;
            }
    
            for (const element of actionFilter.elements) {
                if (!playerAction.elements.find((arrItem) => arrItem === element)) {
                    return false;
                }
            }
        }

        if (actionFilter.style && actionFilter.style != playerAction.style) {
            return false;
        }
    }

    return true;
}

/**
 * 
 * @param {Action} action 
 * @param {ActionFilter} [attackFilter]
* @returns {boolean} 
*/
function matchAttackAction(action, attackFilter) {
    return matchPlayerAction(action, {...attackFilter, isAttack: true})
}

/**
 * 
 * @param {ActionGeneratorCreator} creator 
 * @returns {boolean}
 */
function isBattleMove(creator) {
    return creator.creatorType === GeneratorCreatorType.Ability || 
        creator.creatorType === GeneratorCreatorType.Strike ||
        creator.creatorType === GeneratorCreatorType.StrikeAbility ||
        creator.creatorType === GeneratorCreatorType.Item;
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
            overrideDamageModifier: actionData.overrideDamageModifier,
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
            lightningResistAmp: actionData.lightningResistAmp,
            addAbility: actionData.addAbility,
            removeAbility: actionData.removeAbility
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

module.exports = {
    getTarget,
    findBattleStep,
    findElement,
    generateStandardActions,
    matchPlayerAction,
    matchAttackAction,
    isBattleMove,

}
