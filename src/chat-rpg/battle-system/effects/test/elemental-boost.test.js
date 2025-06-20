/**
 * @import {Action} from "../../action"
 */

const { ElementsEnum, PlayerActionStyle, PlayerActionType } = require("../../action");
const { BattleContext } = require("../../battle-context");
const { StrikeBattleMove } = require("../../strike-battle-move");
const { ElementalBoost } = require("../elemental-boost");

test('Buffing elemental attacks', () => {
    const battleContext = new BattleContext();
    const elementalBoost = new ElementalBoost(battleContext.player, {
        element: ElementsEnum.Fire,
        roundsLeft: 1,
        damageBoost: 1
    });

    /**@type {Action} */
    const damageAction = {
        playerAction: {
            targetPlayer: battleContext.monster,
            srcPlayer: battleContext.player,
            style: PlayerActionStyle.Sword,
            type: PlayerActionType.Physical,
            elements: [ElementsEnum.Fire],
            baseDamage: 10
        }
    };

    const strike = new StrikeBattleMove(battleContext.player)
    const actionGen = elementalBoost.onActionBegin(battleContext, {
        action: damageAction,
        generator: strike.onActivate(battleContext),
        creator: strike
    });

    const firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    let action = /**@type {Action}*/(actionGen.next().value);

    if (!action.actionModAction) {fail();}
    expect(action.actionModAction.targetId).toMatch(battleContext.player.getData().id);
    expect(action.actionModAction.action).toMatch('buff');

    action.actionModAction.modFunction(damageAction);

    expect(damageAction.playerAction?.baseDamageChange).toBe(1);

    const lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();
});

test('Buffing elemental attacks: Wrong element', () => {
    const battleContext = new BattleContext();
    const elementalBoost = new ElementalBoost(battleContext.player, {
        element: ElementsEnum.Water,
        damageBoost: 1,
        roundsLeft: 1
    });

    /**@type {Action} */
    const damageAction = {
        playerAction: {
            targetPlayer: battleContext.monster,
            srcPlayer: battleContext.player,
            style: PlayerActionStyle.Sword,
            type: PlayerActionType.Physical,
            elements: [ElementsEnum.Fire],
            baseDamage: 10
        }
    };

    const strike = new StrikeBattleMove(battleContext.player)
    const actionGen = elementalBoost.onActionBegin(battleContext, {
        action: damageAction,
        generator: strike.onActivate(battleContext),
        creator: strike
    });

    const firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    const lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();
});

test('Buffing elemental attacks: Wrong Player', () => {
    const battleContext = new BattleContext();
    const elementalBoost = new ElementalBoost(battleContext.player, {
        element: ElementsEnum.Fire,
        damageBoost: 1,
        roundsLeft: 1
    });

    /**@type {Action} */
    const damageAction = {
        playerAction: {
            targetPlayer: battleContext.player,
            srcPlayer: battleContext.monster,
            style: PlayerActionStyle.Sword,
            type: PlayerActionType.Physical,
            elements: [ElementsEnum.Fire],
            baseDamage: 10
        }
    };

    const strike = new StrikeBattleMove(battleContext.player)
    const actionGen = elementalBoost.onActionBegin(battleContext, {
        action: damageAction,
        generator: strike.onActivate(battleContext),
        creator: strike
    });

    const firstYield = actionGen.next();

    expect(firstYield.done).toBeTruthy();
});

test('Expiring', () => {
    const battleContext = new BattleContext();
    const elementalBoost = new ElementalBoost(battleContext.player, {
        element: ElementsEnum.Fire,
        damageBoost: 1,
        roundsLeft: 3
    });

    // First Round
    let actionGen = elementalBoost.onBattleRoundEnd(battleContext);
    let firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    let lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();

    // Second Round
    actionGen = elementalBoost.onBattleRoundEnd(battleContext);
    firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();

    // Third Round
    actionGen = elementalBoost.onBattleRoundEnd(battleContext);
    firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();

    // Imbue Expires

    actionGen = elementalBoost.onBattleRoundEnd(battleContext);
    firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    let action = /**@type {Action}*/(actionGen.next().value);

    if (!action.battleContextAction) {fail();}
    expect(action.battleContextAction.removeEffect).toBe(elementalBoost);

    lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();
});
