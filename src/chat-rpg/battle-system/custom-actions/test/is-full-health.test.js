/**
 * @import {Action} from "../../action"
 */

const Ability = require("../../../datastore-objects/ability");
const { BattleContext } = require("../../battle-context");
const { generateActions } = require("../is-full-health");
const utilities = require("../../ability-utility");

test('Full Health', () => {
    const battleContext = new BattleContext();
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

test('Not Full Health', () => {
    const battleContext = new BattleContext();
    battleContext.monster.dealDamage(1);
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

test('Full Health: invert', () => {
    const battleContext = new BattleContext();
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

test('Not Full Health: invert', () => {
    const battleContext = new BattleContext();
    battleContext.monster.dealDamage(1);
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
