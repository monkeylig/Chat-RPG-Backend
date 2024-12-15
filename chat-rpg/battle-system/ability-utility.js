/**
 * @import {Action} from "./action"
 * @import {AbilityData} from "../datastore-objects/ability"
 * @import {ItemData} from "../datastore-objects/item"
 * @import {AbilityActionData} from "../datastore-objects/ability"
 * @import {BattleContext} from "./battle-context"
 */

const AbilityTypes = require("../datastore-objects/ability");
const { BattleAgent } = require("../datastore-objects/battle-agent");
const customActions = require("./custom-actions/custom-actions");
const { getTarget } = require("./utility");
/**
 * 
 * @param {BattleAgent} user 
 * @param {AbilityActionData} actionData 
 * @param {BattleContext} battleContext 
 * @returns {Generator<Action, void, any>}
 */
/**
 * @typedef {Object} AbilityGenUtility
 * @property {(
 * user: BattleAgent,
 * actionData: AbilityActionData,
 * battleContext: BattleContext,
 * customIndex?: number) =>
 * Generator<Action, void, any>} generateActionsFromActionData
 * @property {(
 * user: BattleAgent,
 * moveData: AbilityData | ItemData,
 * battleContext: BattleContext,
 * options?: MoveActionOptions) =>
 * Generator<Action, void, any>} generateMoveActions
 */

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
            maxApChange: actionData.maxApChange,
            apChange: actionData.apChange,
            absorb: actionData.absorb,
            recoil: actionData.recoil,
            heal: actionData.heal,
            healPercent: actionData.healPercent,
            protection: actionData.protection,
            defenseAmp: actionData.defenseAmp,
            strengthAmp: actionData.strengthAmp,
            magicAmp: actionData.magicAmp,
            weaponSpeedAmp:actionData.weaponSpeedAmp,
            lightningResistAmp: actionData.lightningResistAmp,
            fireResistAmp: actionData.fireResistAmp,
            waterResistAmp: actionData.waterResistAmp,
            iceResistAmp: actionData.iceResistAmp,
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

    if (actionData.animation) {
        action.infoAction = {
            description: '',
            action: 'animation',
            animation: actionData.animation,
            targetAgentId: target.getData().id,
            srcAgentId: user.getData().id
        }
    }
    yield action;
}

/**
 * 
 * @param {BattleAgent} user 
 * @param {AbilityActionData} actionData 
 * @param {BattleContext} battleContext 
 * @param {number} [customIndex=0] 
 * @returns {Generator<Action, void, any>}
 */
function *generateActionsFromActionData(user, actionData, battleContext, customIndex = 0) {

    if (actionData.customActions && actionData.customActions[customIndex] &&
        customActions[actionData.customActions[customIndex].name]) {
        const customActionData = actionData.customActions[customIndex];
        const utilities = {
            /**
             * 
             * @param {BattleAgent} user 
             * @param {AbilityActionData} actionData 
             * @param {BattleContext} battleContext 
             * @param {number} [index] 
             * @returns {Generator<Action, void, any>}
             */
            generateActionsFromActionData: function *gen(user, actionData, battleContext, index) {
                if (index === undefined) {
                    yield* generateActionsFromActionData(user, actionData, battleContext, customIndex + 1);
                }
                else {
                    yield* generateActionsFromActionData(user, actionData, battleContext, index);
                }
            },
            generateMoveActions
        };
        yield* customActions[customActionData.name].generateActions(user, actionData, customActionData.data, battleContext, utilities);
    }
    else {
        yield* generateStandardActions(user, actionData, battleContext);
    }
}

/**
 * @typedef {Object} MoveActionOptions
 * @property {boolean} [skipAnimation]
 * @property {boolean} [disableCustomActions]
 * 
 * @param {BattleAgent} user 
 * @param {AbilityData | ItemData} moveData 
 * @param {BattleContext} battleContext 
 * @param {MoveActionOptions} options 
 * @returns {Generator<Action, void, any>}
 */
function *generateMoveActions(user, moveData, battleContext, options = {}) {
    yield* generateActionsFromActionData(user, moveData, battleContext);

    if (moveData.postActions) {
        for (const actionData of moveData.postActions) {
            yield* generateActionsFromActionData(user, actionData, battleContext);
        }
    }
}

/**
 * 
 * @param {BattleAgent} user
 * @param {AbilityTypes.AbilityData} abilityData 
 * @param {BattleContext} battleContext
 * @param {MoveActionOptions} options
 * @returns {Generator<Action, void, any>}
 */
function *generateAbilityActions(user, abilityData, battleContext, options = {}) {
    for (const action of generateMoveActions(user, abilityData, battleContext, options)) {
        yield action;
    }
}

module.exports = {generateAbilityActions, generateMoveActions, generateActionsFromActionData};
