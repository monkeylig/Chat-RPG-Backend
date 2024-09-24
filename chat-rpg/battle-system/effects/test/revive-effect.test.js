/**
 * @import {Action} from "../../action"
 */

const { BattleContext } = require("../../battle-context");
const { StrikeBattleMove } = require("../../strike-battle-move");
const { ReviveEffect } = require("../revive-effect");

test('Revive Effect', () => {
    const battleContext = new BattleContext();
    const reviveEffect = new ReviveEffect(battleContext.player, {healthRecoverPercent: 0.2});
    battleContext.player.getData().health = 0;

    // @ts-ignore
    const actionGenerator = reviveEffect.onActionEnd(battleContext, {}, []);
    const firstYield = actionGenerator.next();

    expect(firstYield.value).toBe(true);

    let action = /**@type {Action}*/(actionGenerator.next().value);

    expect(action.playerAction?.targetPlayer).toBe(battleContext.player);
    expect(action.playerAction?.revive).toBe(0.2);

    action = /**@type {Action}*/(actionGenerator.next().value);

    expect(action.battleContextAction?.removeEffect).toBe(reviveEffect);

    const lastYield = actionGenerator.next();

    expect(lastYield.done).toBeTruthy();
    expect(lastYield.value).toBeUndefined();
});

test('Revive Effect: Player not defeated', () => {
    const battleContext = new BattleContext();
    const reviveEffect = new ReviveEffect(battleContext.player, {healthRecoverPercent: 0.2});

    // @ts-ignore
    const actionGenerator = reviveEffect.onActionEnd(battleContext, {}, []);
    const lastYield = actionGenerator.next();

    expect(lastYield.done).toBeTruthy();
    expect(lastYield.value).toBeUndefined();
});

test('Resolving', () => {
    const battleContext = new BattleContext();
    const reviveEffect = new ReviveEffect(battleContext.player, {healthRecoverPercent: 0.2});
    battleContext.addEffect(reviveEffect);
    battleContext.player.getData().health = 1;

    battleContext.activateBattleMove(new StrikeBattleMove(battleContext.monster));
    const steps = battleContext.resolve();

    expect(battleContext.battle.player.health).toBeGreaterThan(0);

    let reviveFound = false;
    for(const step of steps) {
        if (step.type === 'revive') {
            reviveFound = true;
        }
    }

    expect(reviveFound).toBeTruthy();
});