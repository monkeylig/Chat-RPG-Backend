/**
 * @import {ActionGeneratorObject} from "../action-generator"
 * @import {Action} from "../action"
 * @import {BattleStep} from "../battle-steps"
 * @import {ActiveActionGenerator, ActiveAction} from "../battle-system-types"
 */

const { BattleAgent } = require("../../datastore-objects/battle-agent");
const { BattleContext } = require("../battle-context");
const { Effect } = require("../effect");

test("Effect action generation", () => {
    class EffectTester extends Effect {
        /**
         * @override
         * @param {BattleContext} battleContext
         * @param {ActiveActionGenerator} actionGenerator  
         * @returns {ActionGeneratorObject}
         */
        *actionGeneratorBeginEvent(battleContext, actionGenerator) {
            yield {
                infoAction: {
                    description: "AG Begin Event",
                    action: "Begin"
                }
            };
        }

        /**
         * @override
         * @param {BattleContext} battleContext 
         * @param {ActiveActionGenerator} actionGenerator 
         * @returns {ActionGeneratorObject}
         */
        *actionGeneratorEndEvent(battleContext, actionGenerator) {
            yield {
                infoAction: {
                    description: "AG End Event",
                    action: "End"
                }
            };
        }

        /**
         * @override
         * @param {BattleContext} battleContext 
         * @param {ActiveAction} activeAction 
         * @returns {ActionGeneratorObject}
         */
        *actionBeginEvent(battleContext, activeAction) {
            yield {
                infoAction: {
                    description: "A Begin Event",
                    action: "Begin"
                }
            };
        }

        /**
         * @override
         * @param {BattleContext} battleContext 
         * @param {ActiveAction} activeAction 
         * @param {BattleStep[]} battleSteps 
         * @returns {ActionGeneratorObject}
         */
        *actionEndEvent(battleContext, activeAction, battleSteps) {
            yield {
                infoAction: {
                    description: "A End Event",
                    action: "End"
                }
            };
        }
    }

    const effectTester = new EffectTester(new BattleAgent());

    // @ts-ignore
    let action = /** @type {Action} */ (effectTester.onActionGeneratorBegin(new BattleContext({}), {}).next().value);

    expect(action.infoAction).toBeDefined();
    if(!action.infoAction) {return;}
    expect(action.infoAction.description).toMatch("AG Begin Event");
    expect(action.infoAction.action).toMatch("Begin");

    // @ts-ignore
    action = /** @type {Action} */ (effectTester.actionGeneratorEndEvent(new BattleContext({}), {}).next().value);

    expect(action.infoAction).toBeDefined();
    if(!action.infoAction) {return;}
    expect(action.infoAction.description).toMatch("AG End Event");
    expect(action.infoAction.action).toMatch("End");

    // @ts-ignore
    action = /** @type {Action} */ (effectTester.actionBeginEvent(new BattleContext({}), {}).next().value);

    expect(action.infoAction).toBeDefined();
    if(!action.infoAction) {return;}
    expect(action.infoAction.description).toMatch("A Begin Event");
    expect(action.infoAction.action).toMatch("Begin");

    // @ts-ignore
    action = /** @type {Action} */ (effectTester.actionEndEvent(new BattleContext({}), {}).next().value);

    expect(action.infoAction).toBeDefined();
    if(!action.infoAction) {return;}
    expect(action.infoAction.description).toMatch("A End Event");
    expect(action.infoAction.action).toMatch("End");
});