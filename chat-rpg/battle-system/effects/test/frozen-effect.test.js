/**
 * @import {Action} from "../../action"
 * @import {ActiveAction} from "../../battle-system-types"
 */

const { BattleContext } = require("../../battle-context");
const { BattleMove } = require("../../battle-move");
const { ElementsEnum } = require("../../action");
const { ActionExecutor } = require("../../action-executor");
const { FrozenEffect } = require("../frozen-effect");
const { StrikeBattleMove } = require("../../strike-battle-move");

test('Gaining Frozen', () => {
    const battleContext = new BattleContext();

    const testMove = new BattleMove(battleContext.player);
    const testMoveGenerator = testMove.onActivate(battleContext);
    /**@type {Action} */
    const addEffectAction = {
        battleContextAction: {
            addEffect: {
                targetId: battleContext.player.getData().id,
                className: 'FrozenEffect',
                inputData: {
                    element: ElementsEnum.Fire,
                    roundsLeft: 1
                }
            }
        }
    };
    const steps = ActionExecutor.execute(addEffectAction, battleContext);
    const frozenEffect = battleContext.getActiveEffects().find((_effects) => _effects.className === 'FrozenEffect');

    if (!frozenEffect) {fail();}

    const frozenGen = frozenEffect.onActionEnd(battleContext, {
        action: addEffectAction, 
        generator: testMoveGenerator,
        creator: testMove}, steps);

    const firstYield = frozenGen.next();

    expect(firstYield.value).toBe(true);

    const action = /**@type {Action}*/(frozenGen.next().value);

    if(!action.infoAction) {fail();}
    expect(action.infoAction.action).toMatch('frozen');

    const lastYield = frozenGen.next();

    expect(lastYield.done).toBeTruthy();
});

test('Freezing the Target', () => {
    const battleContext = new BattleContext();
    const strike = new StrikeBattleMove(battleContext.player);
    const strikeGen = strike.onActivate(battleContext);
    strikeGen.next();

    /**@type {ActiveAction} */
    const activeActionGen = {
        creator: strike,
        generator: strikeGen,
        action: /**@type {Action}*/(strikeGen.next().value)
    };

    const frozenEffect = new FrozenEffect(battleContext.player, {
        attackChance: 1,
        roundsLeft: 3
    });

    const frozenGen = frozenEffect.onActionEnd(battleContext, activeActionGen, []);
    const firstYield = frozenGen.next();

    expect(firstYield.value).toBe(true);

    let action = /**@type {Action}*/(frozenGen.next().value);

    if (!action.battleContextAction) {fail();}
    if (!action.infoAction) {fail();}
    expect(action.battleContextAction.removeActionGenerator).toBe(strikeGen);
    expect(action.battleContextAction.targetId).toBe(battleContext.player.getData().id);
    expect(action.infoAction.action).toMatch('freeze');

    const lastYield = frozenGen.next();

    expect(lastYield.done).toBeTruthy();

});

test('Freezing the wrong Target', () => {
    const battleContext = new BattleContext();
    const strike = new StrikeBattleMove(battleContext.monster);
    const strikeGen = strike.onActivate(battleContext);
    strikeGen.next();

    /**@type {ActiveAction} */
    const activeActionGen = {
        creator: strike,
        generator: strikeGen,
        action: /**@type {Action}*/(strikeGen.next().value)
    };

    const frozenEffect = new FrozenEffect(battleContext.player, {
        attackChance: 1,
        roundsLeft: 3
    });

    const frozenGen = frozenEffect.onActionEnd(battleContext, activeActionGen, []);
    const firstYield = frozenGen.next();

    expect(firstYield.done).toBeTruthy();
});

test('Frozen Expiring', () => {
    const battleContext = new BattleContext();
    const frozenEffect = new FrozenEffect(battleContext.player, {
        attackChance: 1,
        roundsLeft: 3
    });

    // First Round
    let actionGen = frozenEffect.onBattleRoundEnd(battleContext);
    let firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    let lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();

    // Second Round
    actionGen = frozenEffect.onBattleRoundEnd(battleContext);
    firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();

    // Third Round
    actionGen = frozenEffect.onBattleRoundEnd(battleContext);
    firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();

    // Frozen Expires

    actionGen = frozenEffect.onBattleRoundEnd(battleContext);
    firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    let action = /**@type {Action}*/(actionGen.next().value);

    if (!action.battleContextAction) {fail();}
    expect(action.battleContextAction.removeEffect).toBe(frozenEffect);

    lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();
});
