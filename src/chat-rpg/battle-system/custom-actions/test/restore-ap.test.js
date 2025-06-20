/**
 * @import {Action} from "../../action"
 */

const Ability = require("../../../datastore-objects/ability");
const { BattleContext } = require("../../battle-context");
const { generateActions } = require("../restore-ap");
const utilities = require("../../ability-utility");
const { ActionExecutor } = require("../../action-executor");

test('Restore AP', () => {
    const battleContext = new BattleContext();
    battleContext.player.getData().ap = 0;
    const ability = new Ability({
        baseDamage: 50,
        target: 'self'
    });

    const actions = generateActions(battleContext.player, ability.getData(), {}, battleContext, utilities);

    let action = /**@type {Action}*/(actions.next().value);
    if (!action.playerAction || !action.playerAction.baseDamage) {
        fail();
    }

    expect(action.playerAction.baseDamage).toBe(50);
    expect(action.playerAction.targetPlayer).toBe(battleContext.player);

    action = /**@type {Action}*/(actions.next().value);

    if (!action.playerAction) {
        fail();
    }

    expect(action.playerAction.apChange).toBe(3);
    expect(action.playerAction.targetPlayer).toBe(battleContext.player);
});

test('Restore AP and increase max', () => {
    const battleContext = new BattleContext();
    battleContext.player.getData().ap = 0;
    const ability = new Ability({
        baseDamage: 50,
        target: 'self',
        maxApChange: 1
    });

    const actions = generateActions(battleContext.player, ability.getData(), {}, battleContext, utilities);

    let action = /**@type {Action}*/(actions.next().value);
    if (!action.playerAction) {
        fail();
    }

    expect(action.playerAction.baseDamage).toBe(50);
    expect(action.playerAction.maxApChange).toBe(1);
    expect(action.playerAction.targetPlayer).toBe(battleContext.player);

    ActionExecutor.execute(action, battleContext);

    action = /**@type {Action}*/(actions.next().value);

    if (!action.playerAction) {
        fail();
    }

    expect(action.playerAction.apChange).toBe(4);
    expect(action.playerAction.targetPlayer).toBe(battleContext.player);
});

test('Restore AP: full ap', () => {
    const battleContext = new BattleContext();
    const ability = new Ability({
        baseDamage: 50,
        target: 'self'
    });

    const actions = generateActions(battleContext.player, ability.getData(), {}, battleContext, utilities);

    const action = /**@type {Action}*/(actions.next().value);
    if (!action.playerAction || !action.playerAction.baseDamage) {
        fail();
    }

    expect(action.playerAction.baseDamage).toBe(50);
    expect(action.playerAction.apChange).toBe(0);
    expect(action.playerAction.targetPlayer).toBe(battleContext.player);
});

test('Deplete AP', () => {
    const battleContext = new BattleContext();
    const ability = new Ability({
        baseDamage: 50,
        target: 'self'
    });

    const actions = generateActions(battleContext.player, ability.getData(), {deplete: true}, battleContext, utilities);

    actions.next();
    const action = /**@type {Action}*/(actions.next().value);
    if (!action.playerAction) {
        fail();
    }

    expect(action.playerAction.apChange).toBe(-3);
    expect(action.playerAction.targetPlayer).toBe(battleContext.player);
});
