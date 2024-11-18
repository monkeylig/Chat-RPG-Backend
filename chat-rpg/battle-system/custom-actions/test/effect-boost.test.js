/**
 * @import {Action} from "../../action"
 */

const Ability = require("../../../datastore-objects/ability");
const { generateActionsFromActionData, generateMoveActions } = require("../../ability-utility");
const { BattleContext } = require("../../battle-context");
const { AblazedEffect } = require("../../effects/ablazed-effect");
const { ImbueEffect } = require("../../effects/imbue-effect");
const { generateActions } = require("../effect-boost");

test('No Boost', () => {
    const battleContext = new BattleContext();
    const ability = new Ability({
        baseDamage: 50,
        target: 'opponent'
    });

    const actions = generateActions(battleContext.player,
        ability.getData(),
        {damageIncrease: 10, effectClass: "AblazedEffect"},
        battleContext,
        {generateActionsFromActionData, generateMoveActions});

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

    // @ts-ignore
    const ablazedEffect = new AblazedEffect(battleContext.monster, {});
    battleContext.addEffect(ablazedEffect);
    const actions = generateActions(battleContext.player,
        ability.getData(),
        {damageIncrease: 10, effectClass: "AblazedEffect"},
        battleContext,
        {generateActionsFromActionData, generateMoveActions});

    const action = /**@type {Action}*/(actions.next().value);
    if (!action.playerAction || !action.playerAction.baseDamage) {
        fail();
    }

    expect(action.playerAction.baseDamage).toBe(60);
    expect(action.playerAction.targetPlayer).toBe(battleContext.monster);
});

describe.each([
    ['physical'],
    ['magical']
])('%s protection boost', (type) => {
    test('Boost', () => {
        const battleContext = new BattleContext();
        battleContext.player.getData().weapon.speedAmp = 1;
        const ability = new Ability({
            protection: {[type]: 10},
            target: 'self'
        });

        // @ts-ignore
        const imbueEffect = new ImbueEffect(battleContext.player, {element: 'fire'});
        battleContext.addEffect(imbueEffect);
        const actions = generateActions(battleContext.player,
            ability.getData(),
            {protectionIncrease: {[type]: 10}, effectClass: "ImbueEffect", imbueElements: ['fire'], target: 'self'},
            battleContext,
            {generateActionsFromActionData, generateMoveActions});

        const action = /**@type {Action}*/(actions.next().value);
        if (!action.playerAction || !action.playerAction.protection) {
            fail();
        }

        expect(action.playerAction.protection[type]).toBe(20);
        expect(action.playerAction.targetPlayer).toBe(battleContext.player);
    });

    test('Imbue wrong element', () => {
        const battleContext = new BattleContext();
        battleContext.player.getData().weapon.speedAmp = 1;
        const ability = new Ability({
            protection: {[type]: 10},
            target: 'self'
        });

        // @ts-ignore
        const imbueEffect = new ImbueEffect(battleContext.player, {element: 'fire'});
        battleContext.addEffect(imbueEffect);
        const actions = generateActions(battleContext.player,
            ability.getData(),
            {protectionIncrease: {[type]: 10}, effectClass: "ImbueEffect", imbueElements: ['water'], target: 'self'},
            battleContext,
            {generateActionsFromActionData, generateMoveActions});

        const action = /**@type {Action}*/(actions.next().value);
        if (!action.playerAction || !action.playerAction.protection) {
            fail();
        }

        expect(action.playerAction.protection[type]).toBe(10);
        expect(action.playerAction.targetPlayer).toBe(battleContext.player);
    });
});

test('Extra Ability', () => {
    const battleContext = new BattleContext();
    battleContext.player.getData().weapon.speedAmp = 1;
    const ability = new Ability({
        baseDamage: 50,
        target: 'opponent'
    });

    // @ts-ignore
    const ablazedEffect = new AblazedEffect(battleContext.monster, {});
    battleContext.addEffect(ablazedEffect);
    const actions = generateActions(battleContext.player, ability.getData(), {
        damageIncrease: 10, 
        effectClass: "AblazedEffect",
        extraActions: [
            {
                strengthAmp: 2,
                target: 'self'
            }
        ]
    }, battleContext, {generateActionsFromActionData, generateMoveActions});

    actions.next();
    const action = /**@type {Action}*/(actions.next().value);
    if (!action.playerAction || !action.playerAction.strengthAmp) {
        fail();
    }


    expect(action.playerAction.strengthAmp).toBe(2);
    expect(action.playerAction.targetPlayer).toBe(battleContext.player);
});
