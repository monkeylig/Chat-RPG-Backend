/**
 * @import {Action} from "../action"
 */

const { generateAbilityActions, generateMoveActions } = require("../ability-utility");
const Ability = require("../../datastore-objects/ability");
const { BattleContext } = require("../battle-context");
const Item = require("../../datastore-objects/item");
const animations = require("../../content/animations");

test('Generate root level hit action', () => {
    const battleContext = new BattleContext();
    const ability = new Ability({
        baseDamage: 10,
        target: 'opponent',
        animation: {}
    });

    const actions = generateAbilityActions(battleContext.player, ability.getData(), battleContext);
    let action = /** @type {Action} */(actions.next().value);

    expect(action.infoAction).toBeDefined();
    expect(action.playerAction).toBeDefined();
    expect(action.playerAction?.baseDamage).toBe(10);
    expect(action.playerAction?.targetPlayer).toBe(battleContext.monster);
    expect(action.playerAction?.srcPlayer).toBe(battleContext.player);

    const lastYield = actions.next();

    expect(lastYield.done).toBeTruthy();
    expect(lastYield.value).toBeUndefined();

});

test('Elements', () => {
    const battleContext = new BattleContext();
    const ability = new Ability({
        baseDamage: 10,
        elements: ['fire', 'water'],
        target: 'opponent'
    });

    const actions = generateAbilityActions(battleContext.player, ability.getData(), battleContext, {skipAnimation: true});
    let action = /** @type {Action} */(actions.next().value);

    if (!action.playerAction) {fail();}
    expect(action.playerAction.baseDamage).toBe(10);
    expect(action.playerAction.targetPlayer).toBe(battleContext.monster);
    expect(action.playerAction.srcPlayer).toBe(battleContext.player);
    if (!action.playerAction.elements) {fail();}
    expect(action.playerAction.elements[0]).toMatch('fire');
    expect(action.playerAction.elements[1]).toMatch('water');

    const lastYield = actions.next();

    expect(lastYield.done).toBeTruthy();
    expect(lastYield.value).toBeUndefined();

});

test('Revive Item With custom actions', () => {
    const battleContext = new BattleContext();
    const item = new Item({
        count: 1,
        name: 'testItem',
        target: 'self',
        customActions: [
            {
            name: 'Revive',
            data: {
                healthRecoverPercent: 0.75
            }
            },
        ]
    });

    const actions = generateMoveActions(battleContext.player, item.getData(), battleContext, {skipAnimation: true});
    let action = /** @type {Action} */(actions.next().value);

    expect(action.battleContextAction).toBeDefined();
    expect(action.battleContextAction?.addEffect?.className).toMatch('ReviveEffect');
    expect(action.battleContextAction?.addEffect?.inputData.healthRecoverPercent).toBe(0.75);
    expect(action.battleContextAction?.addEffect?.targetId).toBe(battleContext.player.getData().id);
});

test('Absorb', () => {
    const battleContext = new BattleContext();
    const ability = new Ability({
        baseDamage: 50,
        absorb: 0.5,
        target: 'opponent',
    });


    const actions = generateAbilityActions(battleContext.player, ability.getData(), battleContext, {skipAnimation: true});
    let action = /** @type {Action} */(actions.next().value);

    if (!action.playerAction) {
        fail();
    }

    expect(action.playerAction.absorb).toBe(0.5);
});

test('Adding Effects', () => {
    const battleContext = new BattleContext();
        const ability = new Ability({
            addEffect: {
                class: 'AblazedEffect',
                inputData: {
                    trueDamage: 30,
                    roundsLeft: 2
                }
            },
            target: 'self',
        });

        const actions = generateMoveActions(battleContext.player, ability.getData(), battleContext, {skipAnimation: true});
        let action = /**@type {Action} */(actions.next().value);

        if (!action.battleContextAction || 
            !action.battleContextAction.addEffect
        ) {
            fail();
        }

        expect(action.battleContextAction.addEffect.className).toMatch('AblazedEffect');
        expect(action.battleContextAction.addEffect.targetId).toMatch(battleContext.player.getData().id);
        expect(action.battleContextAction.addEffect.inputData).toStrictEqual({trueDamage: 30, roundsLeft: 2});
});

test('Adding Effects: Default inputData', () => {
    const battleContext = new BattleContext();
        const ability = new Ability({
            addEffect: {
                class: 'AblazedEffect',
            },
            target: 'self',
        });

        const actions = generateMoveActions(battleContext.player, ability.getData(), battleContext, {skipAnimation: true});
        let action = /**@type {Action} */(actions.next().value);

        if (!action.battleContextAction || 
            !action.battleContextAction.addEffect
        ) {
            fail();
        }

        expect(action.battleContextAction.addEffect.className).toMatch('AblazedEffect');
        expect(action.battleContextAction.addEffect.targetId).toMatch(battleContext.player.getData().id);
});

describe.each([
    ['defenseAmp'],
    ['strengthAmp'],
    ['lightningResistAmp'],
    ['fireResistAmp'],
    ['waterResistAmp'],
    ['weaponSpeedAmp'],
])('%s test', (stat) => {
    test('basic modding', () => {
        const battleContext = new BattleContext();
        const ability = new Ability({
            [stat]: 1,
            target: 'self',
        });

        const actions = generateMoveActions(battleContext.player, ability.getData(), battleContext, {skipAnimation: true});
        let action = /**@type {Action} */(actions.next().value);

        if (!action.playerAction) {
            fail();
        }
        expect(action.playerAction[stat]).toBe(1);
    });
});

describe.each([
    ['physical'],
    ['magical']
])('%s protection test', (type) => {
    test('Adding protection', () => {
        const battleContext = new BattleContext();
        const ability = new Ability({
            protection: {
                [type]: 60
            },
            target: 'self',
        });

        const actions = generateMoveActions(battleContext.player, ability.getData(), battleContext, {skipAnimation: true});
        let action = /**@type {Action} */(actions.next().value);

        if (!action.playerAction || 
            !action.playerAction.protection
        ) {
            fail();
        }

        expect(action.playerAction.protection[type]).toBe(60);
    });
});

describe.each([
    ['physical'],
    ['magical']
])('%s empowerment test', (type) => {
    test('Empowerment Effect', () => {
        const battleContext = new BattleContext();
        const ability = new Ability({
            addEffect: {
                class: 'EmpowermentEffect',
                inputData: {
                    damageIncrease: 10,
                    type
                }
            },
            target: 'self',
        });

        const actions = generateMoveActions(battleContext.player, ability.getData(), battleContext, {skipAnimation: true});
        let action = /**@type {Action} */(actions.next().value);

        if (!action.battleContextAction || 
            !action.battleContextAction.addEffect
        ) {
            fail();
        }

        expect(action.battleContextAction.addEffect.className).toMatch('EmpowermentEffect');
        expect(action.battleContextAction.addEffect.targetId).toMatch(battleContext.player.getData().id);
        expect(action.battleContextAction.addEffect.inputData).toStrictEqual({damageIncrease: 10, type});
    });

    test('Empowerment: Short hand syntax', () => {
        const battleContext = new BattleContext();
        const ability = new Ability({
            empowerment: {
                [type]: 60
            },
            target: 'self',
        });

        const actions = generateMoveActions(battleContext.player, ability.getData(), battleContext, {skipAnimation: true});
        let action = /**@type {Action} */(actions.next().value);

        if (!action.battleContextAction || 
            !action.battleContextAction.addEffect
        ) {
            fail();
        }

        expect(action.battleContextAction.addEffect.className).toMatch('EmpowermentEffect');
        expect(action.battleContextAction.addEffect.targetId).toMatch(battleContext.player.getData().id);
        expect(action.battleContextAction.addEffect.inputData).toStrictEqual({damageIncrease: 60, type});
    });
});

test('Post Actions', () => {
    const battleContext = new BattleContext();
    const ability = new Ability({
        baseDamage: 10,
        postActions: [
            {
                baseDamage: 20,
                target: 'opponent'
            },
            {
                baseDamage: 30,
                target: 'opponent'
            },
        ],
        target: 'opponent',
    });


    const actions = generateAbilityActions(battleContext.player, ability.getData(), battleContext, {skipAnimation: true});
    let action = /**@type {Action} */(actions.next().value);

    if (!action.playerAction || !action.playerAction.baseDamage) {
        fail();
    }

    expect(action.playerAction.baseDamage).toBe(10);

    action = /**@type {Action} */(actions.next().value);

    if (!action.playerAction || !action.playerAction.baseDamage) {
        fail();
    }

    expect(action.playerAction.baseDamage).toBe(20);

    action = /**@type {Action} */(actions.next().value);

    if (!action.playerAction || !action.playerAction.baseDamage) {
        fail();
    }

    expect(action.playerAction.baseDamage).toBe(30);
});

describe.each([
    ['trueDamage', 0.3],
    ['defensePen', 0.5],
    ['addAbility', new Ability()],
    ['removeAbility', 'coolAbility'],
    ['overrideDamageModifier', 'defense'],
    ['recoil', 0.5],
    ['healPercent', 0.5],
    ['heal', 50],
    ['maxApChange', 50],
])('%s player action field test', (field, value) => {
    test('propagation', () => {
        const battleContext = new BattleContext();
        const abilityData = {
            [field]: value,
            target: 'opponent',
            animation: undefined,
            name: '',
            speed: 0,
            description: ''
        };


        const actions = generateAbilityActions(battleContext.player, abilityData, battleContext, {skipAnimation: true});
        let action = /**@type {Action} */(actions.next().value);

        if (!action.playerAction || !action.playerAction[field]) {
            fail();
        }

        expect(action.playerAction[field]).toBe(value);
        expect(action.playerAction.targetPlayer).toBe(battleContext.monster);
    });
});

test('Chaining Custom Actions', () => {
    const battleContext = new BattleContext();
    const ability = new Ability({
        target: 'opponent',
        baseDamage: 10,
        customActions: [
            {
                name: 'HealthBasedDamage',
                data: {
                    bonusDamage: 10
                }
            },
            {
                name: 'MultiHitAttack',
                data: {
                    minHits: 2, 
                    maxHits: 2
                }
            }
        ],
    });

    const actions = generateMoveActions(battleContext.player, ability.getData(), battleContext, {skipAnimation: true});
    let action = /** @type {Action} */(actions.next().value);

    if (!action.playerAction) {fail();}
    expect(action.playerAction.baseDamage).toBe(20);

    action = /** @type {Action} */(actions.next().value);

    if (!action.playerAction) {fail();}
    expect(action.playerAction.baseDamage).toBe(20);
});
