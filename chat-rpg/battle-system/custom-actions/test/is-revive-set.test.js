/**
 * @import {Action} from "../../action"
 */

const Ability = require("../../../datastore-objects/ability");
const { BattleContext } = require("../../battle-context");
const { generateActions } = require("../is-revive-set");
const utilities = require("../../ability-utility");

test('Revive Set', () => {
    const battleContext = new BattleContext();
    // @ts-ignore
    battleContext.monster.getData().effectsMap['revive'] = {};
    const ability = new Ability({
        baseDamage: 50,
        target: 'opponent'
    });

    const actions = generateActions(battleContext.player, ability.getData(), {}, battleContext, utilities);

    const action = /**@type {Action}*/(actions.next().value);
    if (!action.playerAction || !action.playerAction.baseDamage) {
        fail();
    }

    expect(action.playerAction.baseDamage).toBe(50);
    expect(action.playerAction.targetPlayer).toBe(battleContext.monster);
});

test('Revive not Set', () => {
    const battleContext = new BattleContext();
    const ability = new Ability({
        baseDamage: 50,
        target: 'opponent'
    });

    const actions = generateActions(battleContext.player, ability.getData(), {}, battleContext, utilities);

    const action = /**@type {Action}*/(actions.next().value);
    if (!action.infoAction || 
        !action.infoAction.action) {
        fail();
    }

    expect(action.infoAction.action).toMatch('unsuccessful');
});

test('Revive Set: invert', () => {
    const battleContext = new BattleContext();
    // @ts-ignore
    battleContext.monster.getData().effectsMap['revive'] = {};
    const ability = new Ability({
        baseDamage: 50,
        target: 'opponent'
    });

    const actions = generateActions(battleContext.player, ability.getData(), {invert: true}, battleContext, utilities);

    const action = /**@type {Action}*/(actions.next().value);
    if (!action.infoAction || 
        !action.infoAction.action) {
        fail();
    }

    expect(action.infoAction.action).toMatch('unsuccessful');
});

test('Revive Not Set: invert', () => {
    const battleContext = new BattleContext();
    const ability = new Ability({
        baseDamage: 50,
        target: 'opponent'
    });

    const actions = generateActions(battleContext.player, ability.getData(), {invert: true}, battleContext, utilities);

    const action = /**@type {Action}*/(actions.next().value);
    if (!action.playerAction || !action.playerAction.baseDamage) {
        fail();
    }

    expect(action.playerAction.baseDamage).toBe(50);
    expect(action.playerAction.targetPlayer).toBe(battleContext.monster);
});
