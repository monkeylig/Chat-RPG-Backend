/**
 * @import {Action} from "./action"
 * @import {BattleStep, InfoBattleStep} from "./battle-steps"
 * @import {BattleContext} from "./battle-context"
 * @import {BattleAgent} from "../datastore-objects/battle-agent"
 * @import {ActionGeneratorCreator} from "./battle-system-types"
 */

const { GeneratorCreatorType } = require("./battle-system-types");

const EXP_LEVEL_CAP = 99;

/**
 * 
 * @param {number} level
 * @returns {number}
 */
function agentGrowthAtLevel(level) {
    if (level <= 1) {
        return 0;
    }

    const pointRamp = 5;
    const firstHundredLevelPoints = pointRamp * 100;
    const hundredsLevels = Math.floor(level/100);

    let pointsGained = firstHundredLevelPoints * hundredsLevels * (hundredsLevels + 1) / 2;

    const hundredsRemainder = level - hundredsLevels*100;
    const currentPointRamp = pointRamp * (hundredsLevels + 1);

    pointsGained += hundredsRemainder * currentPointRamp;

    return pointsGained - 5;
}

/**
 * Return the points that should be added to an Agent's stats upon leveling up to a target level
 * @param {number} level
 * @param {number} fromLevel
 * @returns {number} 
 */
function calcAgentGrowth(level, fromLevel = 1) {
    if (level <= fromLevel) {
        return 0;
    }

    return agentGrowthAtLevel(level) - agentGrowthAtLevel(fromLevel);
}

/**
 * 
 * @param {number} level 
 * @returns {number}
 */
function calcAgentBaselineHealth(level) {
    return calcAgentGrowth(level) / 4 * 0.9;
}

/**
 * 
 * @param {number} trueDamage 
 * @param {number} targetLevel
 * @returns {number} 
 */
function calcTrueDamage(trueDamage, targetLevel) {
    return (calcAgentBaselineHealth(targetLevel) + 10) * (trueDamage/100);
}


/**
 * 
 * @param {number} attackerLevel 
 * @param {number} baseDamage 
 * @param {number} attack 
 * @param {number} defense 
 * @returns {number}
 */
function calcHitDamage(attackerLevel, baseDamage, attack, defense) {
    const hpBaseline = calcAgentBaselineHealth(attackerLevel) + 12;
    return ((hpBaseline * 0.2) * baseDamage * attack / defense) / 50;
}

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
 * Return array of a all battle step of a certain type
 * @param {string} type Battle step type
 * @param {BattleStep[]} battleSteps Array of battle steps
 * @returns {BattleStep[]}
 */
function findBattleSteps(type, battleSteps) {
    const result = [];
    for (const step of battleSteps) {
        if (step.type === type) {
            result.push(step);
        }
    }

    return result;
}

/**
 * Return true if the array contains a dodge battle step, and false otherwise
 * @param {BattleStep[]} battleSteps 
 * @returns {boolean}
 */
function dodgedSteps(battleSteps) {
    const step = /**@type {InfoBattleStep|undefined}*/(findBattleStep('info', battleSteps));
    return step !== undefined && step.action === 'dodge';
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
 * @property {string} [type]
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

        if (actionFilter.type && actionFilter.type != playerAction.type) {
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



module.exports = {
    getTarget,
    findBattleStep,
    findElement,
    matchPlayerAction,
    matchAttackAction,
    isBattleMove,
    calcHitDamage,
    calcAgentGrowth,
    agentGrowthAtLevel,
    calcTrueDamage,
    dodgedSteps,
    findBattleSteps,
    EXP_LEVEL_CAP
}
