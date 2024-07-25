/**
 * @import {Action} from "../../action"
 */

const Ability = require("../../../datastore-objects/ability");
const { BattleWeapon } = require("../../../datastore-objects/battle-agent");
const { BattleContext } = require("../../battle-context");
const { generateActions } = require("../speed-damage-boost");

test('No Boost', () => {
    const battleContext = new BattleContext();
    const ability = new Ability({
        baseDamage: 50,
        target: 'opponent'
    });

    const actions = generateActions(battleContext.player, ability.getData(), {damageMultiplier: 5}, battleContext);

    const action = /**@type {Action}*/(actions.next().value);
    if (!action.playerAction || !action.playerAction.baseDamage) {
        fail();
    }

    expect(action.playerAction.baseDamage).toBe(50);
    expect(action.playerAction.targetPlayer).toBe(battleContext.monster);
});

test('Boost', () => {
    const battleContext = new BattleContext();
    battleContext.player.getData().weapon.speedAmp = 1;
    const ability = new Ability({
        baseDamage: 50,
        target: 'opponent'
    });

    const actions = generateActions(battleContext.player, ability.getData(), {damageMultiplier: 5}, battleContext);

    const action = /**@type {Action}*/(actions.next().value);
    if (!action.playerAction || !action.playerAction.baseDamage) {
        fail();
    }

    const weapon = new BattleWeapon(battleContext.player.getData().weapon);

    expect(action.playerAction.baseDamage).toBe(50 + (weapon.getModifiedSpeed() - weapon.getData().speed) * 5);
    expect(action.playerAction.targetPlayer).toBe(battleContext.monster);
});