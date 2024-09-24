/**
 * @import {ActionGeneratorObject} from "../../action-generator"
 * @import {Action} from "../../action"
 */

const { ActionExecutor } = require("../../action-executor");
const { BattleContext } = require("../../battle-context");
const { BattleMove } = require("../../battle-move");
const { DrenchedEffect } = require("../drenched-effect");
const { PlayerActionType, PlayerActionStyle, ElementsEnum } = require("../../action");
const BattleSteps = require("../../battle-steps");
const chatRPGUtility = require("../../../utility");
const seedrandom = require("seedrandom");

test('Gaining Drenched', () => {
    const battleContext = new BattleContext();

    class TestMove extends BattleMove {
        /**
         * @override
         * @param {BattleContext} battleContext 
         * @returns {ActionGeneratorObject}
         */
        *activate(battleContext) {
            yield {
                battleContextAction: {
                    addEffect: {
                        targetId: battleContext.player.getData().id,
                        className: 'DrenchedEffect',
                        inputData: {
                            lightningResistAmp: -2,
                            roundsLeft: 5
                        }
                    }
                }
            };
        }
    }

    const testMove = new TestMove(battleContext.player);
    const testMoveGenerator = testMove.onActivate(battleContext);
    const addEffectAction = /**@type {Action}*/(testMoveGenerator.next().value);
    const steps = ActionExecutor.execute(addEffectAction, battleContext);

    const drenchedEffect = battleContext.getActiveEffects().find((_effects) => _effects.className === 'DrenchedEffect');

    if (!drenchedEffect) {fail();}

    const drenchedGen = drenchedEffect.actionEndEvent(battleContext, {
        action: addEffectAction, 
        generator: testMoveGenerator,
        creator: testMove}, steps);

    const firstYield = drenchedGen.next();

    expect(firstYield.value).toBe(true);

    const action = /**@type {Action}*/(drenchedGen.next().value);

    if(!action.infoAction) {fail();}
    expect(action.infoAction.action).toMatch('drenched');

    const lastYield = drenchedGen.next();

    expect(lastYield.done).toBeTruthy();
});

test('Amplify lightning damage', () => {
    const battleContext = new BattleContext();
    const drenchedEffect = new DrenchedEffect(battleContext.player, {trueDamage: 20, roundsLeft: 5});
    const battleMove = new BattleMove(battleContext.player);

    /**@type {Action} */
    const testAction = {
        playerAction: {
            targetPlayer: battleContext.player,
            baseDamage: 10,
            type: PlayerActionType.Physical,
            style: PlayerActionStyle.Staff,
            elements: [ElementsEnum.Lightning]
        }
    };
    const testGen = battleMove.onActivate(battleContext);
    const actionGen = drenchedEffect.onActionBegin(battleContext, {
        creator: battleMove,
        generator: testGen,
        action: testAction
    });

    const firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    let action = /**@type {Action}*/(actionGen.next().value);

    if (!action.actionModAction) {fail();}
    expect(action.actionModAction.action).toMatch('debuff');
    expect(action.actionModAction.targetAction).toBe(testAction);

    action.actionModAction.modFunction(testAction);

    expect(testAction.playerAction?.trueDamage).toBe(20);

    const lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();
});

test('Amplify lightning damage: Wrong player', () => {
    const battleContext = new BattleContext();
    const drenchedEffect = new DrenchedEffect(battleContext.player, {trueDamage: 20, roundsLeft: 5});
    const battleMove = new BattleMove(battleContext.player);

    /**@type {Action} */
    const testAction = {
        playerAction: {
            targetPlayer: battleContext.monster,
            baseDamage: 10,
            type: PlayerActionType.Physical,
            style: PlayerActionStyle.Staff,
            elements: [ElementsEnum.Lightning]
        }
    };
    const testGen = battleMove.onActivate(battleContext);
    const actionGen = drenchedEffect.onActionBegin(battleContext, {
        creator: battleMove,
        generator: testGen,
        action: testAction
    });

    const firstYield = actionGen.next();

    expect(firstYield.done).toBeTruthy();
});

test('Drenched Expiring', () => {
    const battleContext = new BattleContext();
    const drenchedEffect = new DrenchedEffect(battleContext.player, {trueDamage: 20, roundsLeft: 2});

    //First Round
    let actionGen = drenchedEffect.onBattleRoundEnd(battleContext);
    let firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    let lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();

    //Second Round
    actionGen = drenchedEffect.onBattleRoundEnd(battleContext);
    firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();

    //Third Round
    actionGen = drenchedEffect.onBattleRoundEnd(battleContext);
    firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    let action = /**@type {Action}*/(actionGen.next().value);

    if (!action.battleContextAction) {fail();}
    expect(action.battleContextAction.removeEffect).toBe(drenchedEffect);

    lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();
});

test('Interaction with fire', () => {
    const battleContext = new BattleContext();
    const drenchedEffect = new DrenchedEffect(battleContext.player, {trueDamage: 20, roundsLeft: 2});

    const battleMove = new BattleMove(battleContext.player);

    /**@type {Action} */
    const testAction = {
        playerAction: {
            targetPlayer: battleContext.player,
            baseDamage: 10,
            type: PlayerActionType.Physical,
            style: PlayerActionStyle.Staff,
            elements: [ElementsEnum.Fire]
        }
    };
    const testGen = battleMove.onActivate(battleContext);
    const actionGen = drenchedEffect.onActionEnd(battleContext, {
        creator: battleMove,
        generator: testGen,
        action: testAction
    }, [BattleSteps.damage(battleContext.player, 1, PlayerActionType.Magical)]);

    const firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    let action = /**@type {Action}*/(actionGen.next().value);

    if (!action.battleContextAction) {fail();}
    expect(action.battleContextAction.removeEffect).toBe(drenchedEffect);

    let lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();
});

test('Interaction with fire: Wrong Player', () => {
    const battleContext = new BattleContext();
    const drenchedEffect = new DrenchedEffect(battleContext.player, {trueDamage: 20, roundsLeft: 2});

    const battleMove = new BattleMove(battleContext.player);

    /**@type {Action} */
    const testAction = {
        playerAction: {
            targetPlayer: battleContext.monster,
            baseDamage: 10,
            type: PlayerActionType.Physical,
            style: PlayerActionStyle.Staff,
            elements: [ElementsEnum.Fire]
        }
    };
    const testGen = battleMove.onActivate(battleContext);
    const actionGen = drenchedEffect.onActionEnd(battleContext, {
        creator: battleMove,
        generator: testGen,
        action: testAction
    }, [BattleSteps.damage(battleContext.player, 1, PlayerActionType.Magical)]);

    const firstYield = actionGen.next();

    expect(firstYield.done).toBeTruthy();
});

test('Turning into frozen', () => {
    chatRPGUtility.random = seedrandom('1');
    const battleContext = new BattleContext();
    const drenchedEffect = new DrenchedEffect(battleContext.player, {trueDamage: 20, roundsLeft: 2});

    const battleMove = new BattleMove(battleContext.player);

    /**@type {Action} */
    const testAction = {
        playerAction: {
            targetPlayer: battleContext.player,
            baseDamage: 10,
            type: PlayerActionType.Physical,
            style: PlayerActionStyle.Staff,
            elements: [ElementsEnum.Ice]
        }
    };
    const testGen = battleMove.onActivate(battleContext);
    const actionGen = drenchedEffect.onActionEnd(battleContext, {
        creator: battleMove,
        generator: testGen,
        action: testAction
    }, [BattleSteps.damage(battleContext.player, 1, PlayerActionType.Magical)]);

    const firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    let action = /**@type {Action}*/(actionGen.next().value);

    if (!action.battleContextAction) {fail();}
    expect(action.battleContextAction.removeEffect).toBe(drenchedEffect);
    if (!action.battleContextAction.addEffect) {fail();}
    expect(action.battleContextAction.addEffect.className).toMatch('FrozenEffect');

    let lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();
});
