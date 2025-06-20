/**
 * @import {ActiveActionGenerator} from "../../battle-system-types"
 * @import {Action} from "../../action"
 * @import {StatAmpStep} from "../../battle-steps"
 */

const Ability = require("../../../datastore-objects/ability");
const { BattleContext } = require("../../battle-context");
const { strengthAmp } = require("../../battle-steps");
const { StrikeBattleMove } = require("../../strike-battle-move");
const { findBattleStep } = require("../../utility");
const { AbilityStrikeEffect } = require("../ability-strike-effect");

test('Follow up strike', () => {
    const battleContext = new BattleContext();
    const strikeAbilityEffect = new AbilityStrikeEffect(battleContext.player, {
        strikeDuration: 2,
        ability: new Ability({
            baseDamage: 10,
            target: 'opponent'
        }).getData()
    });

    const strike = new StrikeBattleMove(battleContext.player);

    /**@type {ActiveActionGenerator} */
    const activeActionGen = {
        generator: strike.onActivate(battleContext),
        creator: strike
    };

    //First Strike
    let actionGen = strikeAbilityEffect.onActionGeneratorEnd(battleContext, activeActionGen);

    let firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    let action = /**@type {Action}*/(actionGen.next().value);

    if (!action.playerAction) {fail();}
    expect(action.playerAction.baseDamage).toBe(10);
    expect(action.playerAction.targetPlayer).toBe(battleContext.monster);

    let lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();

    //Second Strike
    actionGen = strikeAbilityEffect.onActionGeneratorEnd(battleContext, activeActionGen);

    firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    action = /**@type {Action}*/(actionGen.next().value);

    if (!action.playerAction) {fail();}
    expect(action.playerAction.baseDamage).toBe(10);
    expect(action.playerAction.targetPlayer).toBe(battleContext.monster);

    action = /**@type {Action}*/(actionGen.next().value);

    if (!action.battleContextAction) {fail();}
    expect(action.battleContextAction.removeEffect).toBe(strikeAbilityEffect);

    lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();
});

test('Resolve', () => {
    const battleContext = new BattleContext();
    const strikeAbilityEffect = new AbilityStrikeEffect(battleContext.player, {
        strikeDuration: 2,
        ability: new Ability({
            strengthAmp: 1,
            target: 'self'
        }).getData()
    });

    battleContext.addEffect(strikeAbilityEffect);
    const strike = new StrikeBattleMove(battleContext.player);
    battleContext.activateBattleMove(strike);

    const steps = battleContext.resolve();

    const strengthAmpStep = /**@type {StatAmpStep}*/(findBattleStep('strengthAmp', steps));

    if (!strengthAmpStep) {fail();}
    expect(strengthAmpStep.ampAmount).toBe(1);
    expect(strengthAmpStep.targetId).toBe(battleContext.player.getData().id);
});