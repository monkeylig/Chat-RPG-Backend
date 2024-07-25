/**
 * @import {Action} from "../../action"
 */

const Ability = require("../../../datastore-objects/ability");
const { BattleContext } = require("../../battle-context");
const { generateActions } = require("../no-ap-damage-boost");

test('No Boost', () => {
    const battleContext = new BattleContext();
    const ability = new Ability({
        baseDamage: 50,
        target: 'opponent'
    });

    const actions = generateActions(battleContext.player, ability.getData(), {damageIncrease: 50}, battleContext);

    const action = /**@type {Action}*/(actions.next().value);

    if (!action.playerAction || !action.playerAction.baseDamage) {
        fail();
    }

    expect(action.playerAction.baseDamage).toBe(50);
    expect(action.playerAction.targetPlayer).toBe(battleContext.monster);
});


test('With Boost', () => {
    const battleContext = new BattleContext();
    battleContext.player.getData().ap = 0;
    const ability = new Ability({
        baseDamage: 50,
        target: 'opponent'
    });

    const actions = generateActions(battleContext.player, ability.getData(), {damageIncrease: 50}, battleContext);

    const action = /**@type {Action}*/(actions.next().value);

    if (!action.playerAction || !action.playerAction.baseDamage) {
        fail();
    }

    expect(action.playerAction.baseDamage).toBe(100);
    expect(action.playerAction.targetPlayer).toBe(battleContext.monster);
});
