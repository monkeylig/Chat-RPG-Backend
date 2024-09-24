/**
 * @import {ActiveActionGenerator} from "../../battle-system-types"
 * @import {Action} from "../../action"
 */

const { AbilityBattleMove } = require("../../ability-battle-move");
const { BattleContext } = require("../../battle-context");
const { MultiTriggerEffect } = require("../multi-trigger-effect");

test('Double trigger ability', () => {
    const battleContext = new BattleContext();
    const ability = new AbilityBattleMove(battleContext.player, {
        target: 'opponent',
        baseDamage: 10
    });

    const triggerEffect = new MultiTriggerEffect(battleContext.player, {triggerTimes: 1});

    /**@type {ActiveActionGenerator} */
    const targetMove = {
        generator: ability.onActivate(battleContext),
        creator: ability
    };

    let actionGen = triggerEffect.onActionGeneratorEnd(battleContext, targetMove);
    let firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    let action = /**@type {Action}*/(actionGen.next().value);

    if (!action.battleContextAction) {fail();}
    if (!action.battleContextAction.triggerAbility) {fail();}
    expect(action.battleContextAction.triggerAbility.user).toBe(battleContext.player);
    expect(action.battleContextAction.triggerAbility.ability).toStrictEqual(ability.getInputData());

    let lastYield = actionGen.next();
    
    expect(lastYield.done).toBeTruthy();

    // Effect Expiring
    /**@type {ActiveActionGenerator} */
    actionGen = triggerEffect.onActionGeneratorEnd(battleContext, targetMove)
    firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    action = /**@type {Action}*/(actionGen.next().value);

    if (!action.battleContextAction) {fail();}
    expect(action.battleContextAction.removeEffect).toBe(triggerEffect);
});