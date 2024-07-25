/**
 * @import {Action} from "../../action"
 * @import {ActionGeneratorObject} from "../../action-generator"
 */

const { ActionExecutor } = require("../../action-executor");
const { BattleContext } = require("../../battle-context");
const { BattleMove } = require("../../battle-move");
const { AblazedEffect } = require("../ablazed-effect");
const { PlayerActionType } = require("../../action");

test('Gaining Ablaze', () => {
    const battleContext = new BattleContext();
    const ablazedEffect = new AblazedEffect(battleContext.player, {
        trueDamage: 30,
        roundsLeft: 2
    });

    class TestMove extends BattleMove {
        /**
         * @override
         * @param {BattleContext} battleContext 
         * @returns {ActionGeneratorObject}
         */
        *activate(battleContext) {
            yield {
                battleContextAction: {
                    addEffect: ablazedEffect
                }
            };
        }
    }

    const testMove = new TestMove(battleContext.player);
    const testMoveGenerator = testMove.onActivate(battleContext);
    const addEffectAction = /**@type {Action}*/(testMoveGenerator.next().value);
    const steps = ActionExecutor.execute(addEffectAction, battleContext);
    const ablazedGen = ablazedEffect.actionEndEvent(battleContext, {
        action: addEffectAction, 
        generator: testMoveGenerator,
        creator: testMove}, steps);

    const firstYield = ablazedGen.next();

    expect(firstYield.value).toBe(true);

    const action = /**@type {Action}*/(ablazedGen.next().value);

    if(!action.infoAction) {fail();}
    expect(action.infoAction.action).toMatch('ablazed');

    const lastYield = ablazedGen.next();

    expect(lastYield.done).toBeTruthy();
});

test('Triggering damage', () => {
    const battleContext = new BattleContext();
    const ablazedEffect = new AblazedEffect(battleContext.player, {
        trueDamage: 0.3,
        roundsLeft: 2
    });

    // First round of damage
    let actionGen = ablazedEffect.onBattleRoundEnd(battleContext);
    let firstYield = actionGen.next().value;

    expect(firstYield).toBe(true);

    let action = /**@type {Action}*/(actionGen.next().value);

    if(!action.playerAction) {fail();}
    expect(action.playerAction.targetPlayer).toBe(battleContext.player);
    expect(action.playerAction.trueDamage).toBe(ablazedEffect.getInputData().trueDamage);
    expect(action.playerAction.type).toBe(PlayerActionType.Natural);
    if(!action.infoAction) {fail();}
    expect(action.infoAction.action).toMatch('ablazeDamage');

    let lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();

    // Last round of damage

    actionGen = ablazedEffect.onBattleRoundEnd(battleContext);
    firstYield = actionGen.next().value;

    expect(firstYield).toBe(true);

    action = /**@type {Action}*/(actionGen.next().value);

    if(!action.playerAction) {fail();}
    expect(action.playerAction.targetPlayer).toBe(battleContext.player);
    expect(action.playerAction.trueDamage).toBe(ablazedEffect.getInputData().trueDamage);
    expect(action.playerAction.type).toBe(PlayerActionType.Natural);
    if(!action.infoAction) {fail();}
    expect(action.infoAction.action).toMatch('ablazeDamage');

    lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();

    // This round, Ablazed will be removed
    actionGen = ablazedEffect.onBattleRoundEnd(battleContext);
    firstYield = actionGen.next().value;

    expect(firstYield).toBe(true);

    action = /**@type {Action}*/(actionGen.next().value);

    if(!action.battleContextAction) {fail();}
    expect(action.battleContextAction.removeEffect).toBe(ablazedEffect);

    lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();
});
