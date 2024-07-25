/**
 * @import {BattleStep} from "./battle-steps"
 * @import {BattleContext} from "./battle-context"
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

module.exports = {getTarget, findBattleStep, findElement}
