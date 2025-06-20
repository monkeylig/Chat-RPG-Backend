/**
 * @import {Action} from "../../action"
 */

const { BattleContext } = require("../../battle-context");
const { StrikeAbilitySurgeEffect } = require("../strike-ability-surge-effect");

test('Ready Srike Ability', () => {
    const battleContext = new BattleContext();
    const strikeSurgeEffect = new StrikeAbilitySurgeEffect(battleContext.player, {roundsLeft: 1});
    const actionGen = strikeSurgeEffect.onBattleRoundEnd(battleContext);

    const firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    let action = /**@type {Action}*/(actionGen.next().value);

    if (!action.playerAction) {fail();}
    expect(action.playerAction.strikeLevelChange).toBe(2);

    const lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();
});

test('Expiring', () => {
    const battleContext = new BattleContext();
    const strikeSurgeEffect = new StrikeAbilitySurgeEffect(battleContext.player, {roundsLeft: 3});

    // First Round
    let actionGen = strikeSurgeEffect.onBattleRoundEnd(battleContext);
    let firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    actionGen.next();
    let lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();

    // Second Round
    actionGen = strikeSurgeEffect.onBattleRoundEnd(battleContext);
    firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    actionGen.next();
    lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();

    // Third Round
    actionGen = strikeSurgeEffect.onBattleRoundEnd(battleContext);
    firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    actionGen.next();
    lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();

    // Expires

    actionGen = strikeSurgeEffect.onBattleRoundEnd(battleContext);
    firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    let action = /**@type {Action}*/(actionGen.next().value);

    if (!action.battleContextAction) {fail();}
    expect(action.battleContextAction.removeEffect).toBe(strikeSurgeEffect);

    lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();
});

test("Restoring to 0 turns left", () => {
    const battleContext = new BattleContext();
    const strikeSurgeEffect = new StrikeAbilitySurgeEffect(battleContext.player, {roundsLeft: 0});

    expect(strikeSurgeEffect.getInputData().roundsLeft).toBe(0);
});
