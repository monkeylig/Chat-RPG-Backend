/**
 * @import {Effect, EffectData} from "../effect"
 */

const { BattleAgent } = require("../../datastore-objects/battle-agent");
const { ReviveEffect } = require("./revive-effect");

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
function createEffect(effectData, targetAgent) {
    if (!effectExists(effectData.className)) {
        return;
    }

    const newEffect = /**@type {Effect}*/(new EffectsLibrary[effectData.className](targetAgent, effectData.inputData));
    newEffect.persistentId = effectData.persistentId;
    return newEffect;
}

const EffectsLibrary = {
    ReviveEffect
};

module.exports = {
    effectExists,
    createEffect,
    EffectsLibrary
};