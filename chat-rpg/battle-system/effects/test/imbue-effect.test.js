/**
 * @import {Action} from "../../action"
 * @import {ActiveAction, ActiveActionGenerator} from "../../battle-system-types"
 */

const { ActionExecutor } = require("../../action-executor");
const { BattleContext } = require("../../battle-context");
const { BattleMove } = require("../../battle-move");
const { ElementsEnum, PlayerActionStyle } = require("../../action");
const { ImbueEffect } = require("../imbue-effect");
const { StrikeBattleMove } = require("../../strike-battle-move");
const { BattlePlayer } = require("../../../datastore-objects/battle-agent");

test('Gaining Imbue', () => {
    const battleContext = new BattleContext();

    const testMove = new BattleMove(battleContext.player);
    const testMoveGenerator = testMove.onActivate(battleContext);
    /**@type {Action} */
    const addEffectAction = {
        battleContextAction: {
            addEffect: {
                targetId: battleContext.player.getData().id,
                className: 'ImbueEffect',
                inputData: {
                    element: ElementsEnum.Fire,
                    roundsLeft: 1
                }
            }
        }
    };
    const steps = ActionExecutor.execute(addEffectAction, battleContext);

    const imbueEffect = battleContext.getActiveEffects().find((_effects) => _effects.className === 'ImbueEffect');

    if (!imbueEffect) {fail();}

    const imbueGen = imbueEffect.onActionEnd(battleContext, {
        action: addEffectAction, 
        generator: testMoveGenerator,
        creator: testMove}, steps);

    const firstYield = imbueGen.next();

    expect(firstYield.value).toBe(true);

    const action = /**@type {Action}*/(imbueGen.next().value);

    if(!action.infoAction) {fail();}
    expect(action.infoAction.action).toMatch('imbued');

    const lastYield = imbueGen.next();

    expect(lastYield.done).toBeTruthy();
});

test('Imbuing Attacks', () => {
    const battleContext = new BattleContext();
    battleContext.player.getData().weapon.style = PlayerActionStyle.Sword;
    const imbueEffect = new ImbueEffect(battleContext.player, {
        element: ElementsEnum.Fire,
        roundsLeft: 1
    });
    const strike = new StrikeBattleMove(battleContext.player);
    const strikeGen = strike.onActivate(battleContext);
    /**@type {Action} */
    const strikeAction = {
        playerAction: {
            targetPlayer: battleContext.monster,
            srcPlayer: battleContext.player,
            style: battleContext.player.getData().weapon.style,
            baseDamage: 10
        }
    };

    /**@type {ActiveAction} */
    const strikeActiveAction = {
        creator: strike,
        generator: strikeGen,
        action: strikeAction
    };

    const actionGen = imbueEffect.onActionBegin(battleContext, strikeActiveAction);

    const firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    let action = /**@type {Action}*/(actionGen.next().value);

    if (!action.actionModAction) {fail();}

    expect(action.actionModAction.action).toMatch('buff');
    expect(action.actionModAction.targetAction).toBe(strikeAction);
    expect(action.actionModAction.targetId).toMatch(battleContext.player.getData().id);

    const inpuData = strike.getInputData();
    action.actionModAction.modFunction(inpuData);

    if (!inpuData.elements) {fail();}
    expect(inpuData.elements[0]).toBe(ElementsEnum.Fire);
});

test('Imbuing Attacks: Wrong Attack', () => {
    const battleContext = new BattleContext();
    battleContext.player.getData().weapon.style = PlayerActionStyle.Sword;
    const imbueEffect = new ImbueEffect(battleContext.player, {
        element: ElementsEnum.Fire,
        roundsLeft: 1
    });
    const strike = new StrikeBattleMove(battleContext.monster);
    const strikeGen = strike.onActivate(battleContext);
    /**@type {Action} */
    const strikeAction = {
        playerAction: {
            targetPlayer: battleContext.monster,
            srcPlayer: battleContext.player,
            style: PlayerActionStyle.Staff,
            baseDamage: 10
        }
    };

    /**@type {ActiveAction} */
    const strikeActiveAction = {
        creator: strike,
        generator: strikeGen,
        action: strikeAction
    };

    const actionGen = imbueEffect.onActionBegin(battleContext, strikeActiveAction);

    const firstYield = actionGen.next();

    expect(firstYield.done).toBeTruthy();
});

test('Imbuing Attacks: Wrong Target', () => {
    const battleContext = new BattleContext();
    battleContext.player.getData().weapon.style = PlayerActionStyle.Sword;
    const imbueEffect = new ImbueEffect(battleContext.player, {
        element: ElementsEnum.Fire,
        roundsLeft: 1
    });
    const strike = new StrikeBattleMove(battleContext.monster);
    const strikeGen = strike.onActivate(battleContext);
    /**@type {Action} */
    const strikeAction = {
        playerAction: {
            targetPlayer: battleContext.player,
            srcPlayer: battleContext.monster,
            style: PlayerActionStyle.Sword,
            baseDamage: 10
        }
    };

    /**@type {ActiveAction} */
    const strikeActiveAction = {
        creator: strike,
        generator: strikeGen,
        action: strikeAction
    };

    const actionGen = imbueEffect.onActionBegin(battleContext, strikeActiveAction);

    const firstYield = actionGen.next();

    expect(firstYield.done).toBeTruthy();
});

test('Imbue Expiring', () => {
    const battleContext = new BattleContext();
    const imbueEffect = new ImbueEffect(battleContext.player, {
        element: ElementsEnum.Fire,
        roundsLeft: 3
    });

    // First Round
    let actionGen = imbueEffect.onBattleRoundEnd(battleContext);
    let firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    let lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();

    // Second Round
    actionGen = imbueEffect.onBattleRoundEnd(battleContext);
    firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();

    // Third Round
    actionGen = imbueEffect.onBattleRoundEnd(battleContext);
    firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();

    // Imbue Expires

    actionGen = imbueEffect.onBattleRoundEnd(battleContext);
    firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    let action = /**@type {Action}*/(actionGen.next().value);

    if (!action.battleContextAction) {fail();}
    expect(action.battleContextAction.removeEffect).toBe(imbueEffect);

    lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();
});
