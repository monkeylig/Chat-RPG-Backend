/**
 * @import {Action} from "../action"
 */

const Ability = require("../../datastore-objects/ability");
const { AbilityBattleMove } = require("../ability-battle-move");
const { BattleContext } = require("../battle-context");

test("Simple damage ability", () => {
    const battleContext = new BattleContext();
    const ability = new Ability({
        target: 'opponent',
        baseDamage: 20,
        apCost: 1,
        animation: {}
    });
    const abilityMove = new AbilityBattleMove(battleContext.player, ability.getData());
    const actionGenerator = abilityMove.onActivate(battleContext);
    const firstYield = /**@type {boolean}*/(actionGenerator.next().value);

    expect(firstYield).toBe(true);

    let actionObject = /**@type {Action}*/(actionGenerator.next().value);

    expect(actionObject.infoAction).toBeDefined();
    expect(actionObject.infoAction?.action).toMatch("ability");
    expect(actionObject.infoAction?.srcAgentId).toMatch("player");
    expect(actionObject.infoAction?.targetAgentId).toMatch("monster");

    actionObject = /**@type {Action}*/(actionGenerator.next().value);

    expect(actionObject.infoAction).toBeDefined();
    expect(actionObject.infoAction?.action).toMatch("animation");
    expect(actionObject.infoAction?.animation).toBeDefined();
    expect(actionObject.infoAction?.srcAgentId).toMatch("player");
    expect(actionObject.infoAction?.targetAgentId).toMatch("monster");

    actionObject = /**@type {Action}*/(actionGenerator.next().value);

    expect(actionObject.playerAction).toBeDefined();
    expect(actionObject.playerAction?.baseDamage).toBe(20);
    expect(actionObject.playerAction?.targetPlayer).toBe(battleContext.monster);

    actionObject = /**@type {Action}*/(actionGenerator.next().value);

    expect(actionObject.playerAction).toBeDefined();
    expect(actionObject.playerAction?.apChange).toBe(-1);
    expect(actionObject.playerAction?.targetPlayer).toBe(battleContext.player);

    const lastYield = actionGenerator.next();

    expect(lastYield.done).toBeTruthy();
    expect(lastYield.value).toBeUndefined();
});

test('Ability uses last charge', () => {
    const battleContext = new BattleContext();
    const ability = new Ability({
        name: 'targetAbility',
        target: 'opponent',
        charges: 2,
        animation: {}
    });
    const abilityMove = new AbilityBattleMove(battleContext.player, ability.getData());

    // First Charge
    let actionGenerator = abilityMove.onActivate(battleContext);
    let firstYield = /**@type {boolean}*/(actionGenerator.next().value);

    expect(firstYield).toBe(true);

    let action = /**@type {Action}*/(actionGenerator.next().value); // Announcing ability
    action = /**@type {Action}*/(actionGenerator.next().value); // Ability animation
    action = /**@type {Action}*/(actionGenerator.next().value); // Execute empty ability

    let lastYield = actionGenerator.next();

    expect(lastYield.done).toBeTruthy();
    expect(lastYield.value).toBeUndefined();

    // Second Charge
    actionGenerator = abilityMove.onActivate(battleContext);
    firstYield = /**@type {boolean}*/(actionGenerator.next().value);

    expect(firstYield).toBe(true);

    action = /**@type {Action}*/(actionGenerator.next().value); // Announcing ability
    action = /**@type {Action}*/(actionGenerator.next().value); // Ability animation
    action = /**@type {Action}*/(actionGenerator.next().value); // Execute empty ability
    action = /**@type {Action}*/(actionGenerator.next().value); // Remove charge

    if (!action.playerAction) {fail();}
    expect(action.playerAction.removeAbility).toMatch("targetAbility");
    expect(action.playerAction.targetPlayer).toBe(battleContext.player);

    lastYield = actionGenerator.next();

    expect(lastYield.done).toBeTruthy();
    expect(lastYield.value).toBeUndefined();
});