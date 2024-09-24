/**
 * @import {Action} from "../../action"
 */

const Ability = require("../../../datastore-objects/ability");
const { BattleContext } = require("../../battle-context");
const { generateActions } = require("../health-based-damage");
const utilities = require("../../ability-utility");

test('Max Damage', () => {
    const battleContext = new BattleContext();
    const ability = new Ability({
        baseDamage: 50,
        target: 'opponent'
    });

    const actions = generateActions(battleContext.player, ability.getData(), {bonusDamage: 50}, battleContext, utilities);

    const action = /**@type {Action}*/(actions.next().value);

    if (!action.playerAction || !action.playerAction.baseDamage) {
        fail();
    }

    expect(action.playerAction.baseDamage).toBe(100);
    expect(action.playerAction.targetPlayer).toBe(battleContext.monster);
});


test('Minimum Damage', () => {
    const battleContext = new BattleContext();
    battleContext.player.getData().health = 0;
    const ability = new Ability({
        baseDamage: 50,
        target: 'opponent'
    });

    const actions = generateActions(battleContext.player, ability.getData(), {bonusDamage: 50}, battleContext, utilities);

    const action = /**@type {Action}*/(actions.next().value);

    if (!action.playerAction || !action.playerAction.baseDamage) {
        fail();
    }

    expect(action.playerAction.baseDamage).toBe(50);
    expect(action.playerAction.targetPlayer).toBe(battleContext.monster);
});
