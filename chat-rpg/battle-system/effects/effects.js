/**
 * @import {Effect, EffectData} from "../effect"
 */

const { BattleAgent } = require("../../datastore-objects/battle-agent");
const { AblazedEffect } = require("./ablazed-effect");
const { EmpowermentEffect } = require("./empowerment-effect");
const { ReviveEffect } = require("./revive-effect");
const { AbilityStrikeEffect } = require('./ability-strike-effect');
const { SurgedEffect } = require("./surged-effect");
const { DrenchedEffect } = require("./drenched-effect");

/**
 * 
 * @param {string} className 
 * @returns {boolean}
 */
function effectExists(className) {
    return EffectsLibrary[className] !== undefined;
}

/**
 * 
 * @param {EffectData} effectData 
 * @param {BattleAgent} targetAgent
 * @returns {Effect|undefined}
 */
function restoreEffect(effectData, targetAgent) {
    if (!effectExists(effectData.className)) {
        return;
    }

    const newEffect = /**@type {Effect}*/(new EffectsLibrary[effectData.className](targetAgent, effectData.inputData));
    if (effectData.persistentId) {
        newEffect.persistentId = effectData.persistentId;
    }
    return newEffect;
}

/**
 * 
 * @param {string} className 
 * @param {Object} inputData 
 * @param {BattleAgent} targetAgent 
 * @returns {Effect|undefined}
 */
function createEffect(className, inputData, targetAgent) {
    if (!effectExists(className)) {
        return;
    }

    const newEffect = /**@type {Effect}*/(new EffectsLibrary[className](targetAgent, inputData));
    return newEffect;
}

const EffectsLibrary = {
    ReviveEffect,
    EmpowermentEffect,
    AblazedEffect,
    SurgedEffect,
    DrenchedEffect,
    AbilityStrikeEffect,
};

module.exports = {
    effectExists,
    restoreEffect,
    createEffect,
    EffectsLibrary
};