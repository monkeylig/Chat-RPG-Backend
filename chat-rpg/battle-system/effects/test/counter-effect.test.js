/**
 * @import {Action} from "../../action"
 * @import {ActiveAction} from "../../battle-system-types"
 */


const { BattleContext } = require("../../battle-context");
const { ActionExecutor } = require("../../action-executor");
const { BattleMove } = require("../../battle-move");
const { CounterEffect } = require("../counter-effect");
const Ability = require("../../../datastore-objects/ability");
const { StrikeBattleMove } = require("../../strike-battle-move");
const { AbilityBattleMove } = require("../../ability-battle-move");

test('Gain Counter', () => {
    const battleContext = new BattleContext();

    const testMove = new BattleMove(battleContext.player);
    const testMoveGenerator = testMove.onActivate(battleContext);
    /**@type {Action} */
    const addEffectAction = {
        battleContextAction: {
            addEffect: {
                targetId: battleContext.player.getData().id,
                className: 'CounterEffect',
                inputData: {
                    filter: {
                        attackType: 'strike' 
                    }
                }
            }
        }
    };
    const steps = ActionExecutor.execute(addEffectAction, battleContext);
    const counterEffect = battleContext.getActiveEffects().find((_effects) => _effects.className === 'CounterEffect');

    if (!counterEffect) {fail();}

    const counterGen = counterEffect.onActionEnd(battleContext, {
        action: addEffectAction, 
        generator: testMoveGenerator,
        creator: testMove}, steps);

    const firstYield = counterGen.next();

    expect(firstYield.value).toBe(true);

    const action = /**@type {Action}*/(counterGen.next().value);

    if(!action.infoAction) {fail();}
    expect(action.infoAction.action).toMatch('counterReady');

    const lastYield = counterGen.next();

    expect(lastYield.done).toBeTruthy();
});

test('Countering an Attack', () => {
    const battleContext = new BattleContext();
    const strike = new StrikeBattleMove(battleContext.monster);
    const strikeGen = strike.onActivate(battleContext);
    strikeGen.next();

    /**@type {ActiveAction} */
    const activeActionGen = {
        creator: strike,
        generator: strikeGen,
        action: /**@type {Action}*/(strikeGen.next().value)
    };
    const counterAbility = new Ability({baseDamage: 10}).getData();
    const counterEffect = new CounterEffect(battleContext.player, {
        filter: {
            attackType: 'strike' 
        },
        ability: counterAbility
    });

    const counterGen = counterEffect.onActionEnd(battleContext, activeActionGen, []);
    const firstYield = counterGen.next();

    expect(firstYield.value).toBe(true);

    let action = /**@type {Action}*/(counterGen.next().value);

    if (!action.battleContextAction) {fail();}
    if (!action.infoAction) {fail();}
    expect(action.battleContextAction.removeActionGenerator).toBe(strikeGen);
    expect(action.battleContextAction.targetId).toBe(battleContext.monster.getData().id);

    const triggerAbility = action.battleContextAction.triggerAbility;

    if(!triggerAbility) {fail();}
    expect(triggerAbility.ability).toStrictEqual(counterAbility);
    expect(triggerAbility.user).toBe(battleContext.player);
    expect(action.infoAction.action).toMatch('counter');

    const lastYield = counterGen.next();

    expect(lastYield.done).toBeTruthy();

});

test('Countering: wrong target', () => {
    const battleContext = new BattleContext();
    const strike = new StrikeBattleMove(battleContext.player);
    const strikeGen = strike.onActivate(battleContext);
    strikeGen.next();

    /**@type {ActiveAction} */
    const activeActionGen = {
        creator: strike,
        generator: strikeGen,
        action: /**@type {Action}*/(strikeGen.next().value)
    };
    const counterAbility = new Ability({baseDamage: 10}).getData();
    const counterEffect = new CounterEffect(battleContext.player, {
        filter: {
            attackType: 'strike' 
        },
        ability: counterAbility
    });

    const counterGen = counterEffect.onActionEnd(battleContext, activeActionGen, []);
    const firstYield = counterGen.next();

    expect(firstYield.done).toBeTruthy();

});

test('Countering: filtered', () => {
    const battleContext = new BattleContext();
    const strike = new AbilityBattleMove(battleContext.monster, new Ability().getData());
    const strikeGen = strike.onActivate(battleContext);
    strikeGen.next();

    /**@type {ActiveAction} */
    const activeActionGen = {
        creator: strike,
        generator: strikeGen,
        action: /**@type {Action}*/(strikeGen.next().value)
    };
    const counterAbility = new Ability({baseDamage: 10}).getData();
    const counterEffect = new CounterEffect(battleContext.player, {
        filter: {
            attackType: 'strike' 
        },
        ability: counterAbility
    });

    const counterGen = counterEffect.onActionEnd(battleContext, activeActionGen, []);
    const firstYield = counterGen.next();

    expect(firstYield.value).toBe(true);

    const lastYield = counterGen.next();

    expect(lastYield.done).toBeTruthy();
});

test('Counter Expiring', () => {
    const battleContext = new BattleContext();
    const counterEffect = new CounterEffect(battleContext.player, {
        filter: {
            attackType: 'strike' 
        },
        ability: new Ability().getData()
    });

    let actionGen = counterEffect.onBattleRoundEnd(battleContext);
    let firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    let action = /**@type {Action}*/(actionGen.next().value);

    if (!action.battleContextAction) {fail();}
    expect(action.battleContextAction.removeEffect).toBe(counterEffect);

    let lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();
});