/**
 * @import {AbilityActionData} from "../../datastore-objects/ability"
 * @import {BattleContext} from "../battle-context"s
 * @import {AbilityGenUtility} from "../ability-utility"
 * @import {ImbueEffectData} from "../effects/imbue-effect"
 */

const { BattleAgent } = require("../../datastore-objects/battle-agent");
const { TargetEnum } = require("../action");
const { getTarget } = require("../utility");

/**
 * @typedef {Object} EffectBoostData
 * @property {number} [damageIncrease]
 * @property {{physical?: number, magical?: number}} [protectionIncrease]
 * @property {{class: string, inputData?: object}} [addEffect]
 * @property {string[]} [imbueElements]
 * @property {string} [effectClass]
 * @property {TargetEnum} [target]
 * @property {AbilityActionData[]} [extraActions]
 * 
 * @param {BattleAgent} user 
 * @param {AbilityActionData} abilityData 
 * @param {EffectBoostData} inputData 
 * @param {BattleContext} battleContext 
 * @param {AbilityGenUtility} utilities 
 */
function *generateActions(user, abilityData, inputData, battleContext, utilities) {
    const targetStr = inputData.target ? inputData.target : 'opponent';
    const target = getTarget(user, targetStr, battleContext);

    const imbueCheck = () => {
        if (inputData.effectClass === 'ImbueEffect' && inputData.imbueElements) {
            for (const imbueElement of inputData.imbueElements) {
                const effect = battleContext.getActiveEffects().find((effect) => {
                    const effectData = /**@type {ImbueEffectData}*/(effect.getInputData());
                    return effect.className === 'ImbueEffect' && effectData.element === imbueElement && effect.targetPlayer === target;
                });
                
                if (!effect) {
                    return false;
                }
            }
            return true
        }
        return true;
    };

    if (inputData.effectClass && battleContext.getEffectCount(inputData.effectClass, target) && imbueCheck()) {
        

        if (abilityData.baseDamage && inputData.damageIncrease) {
            abilityData.baseDamage += inputData.damageIncrease;
        }

        if (inputData.protectionIncrease) {
            if (abilityData.protection === undefined) {
                abilityData.protection = {magical: 0, physical: 0};
            }
            if (inputData.protectionIncrease.physical) {
                if (abilityData.protection.physical === undefined) {
                    abilityData.protection.physical = 0;
                }
                abilityData.protection.physical += inputData.protectionIncrease.physical;
            }
            if (inputData.protectionIncrease.magical) {
                if (abilityData.protection.magical === undefined) {
                    abilityData.protection.magical = 0;
                }
                abilityData.protection.magical += inputData.protectionIncrease.magical;
            }
        }

        if (inputData.addEffect) {
            abilityData.addEffect = inputData.addEffect;
        }

        yield* utilities.generateActionsFromActionData(user, abilityData, battleContext);

        if (inputData.extraActions) {
            for(const action of inputData.extraActions) {
                yield* utilities.generateActionsFromActionData(user, action, battleContext, 0);
            }
        }
        return;
    }

    yield* utilities.generateActionsFromActionData(user, abilityData, battleContext);
}

module.exports = {generateActions};
