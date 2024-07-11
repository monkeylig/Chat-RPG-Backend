const { generateAbilityActions, generateMoveActions } = require("../ability-utility");
const Ability = require("../../datastore-objects/ability");
const { BattleContext } = require("../battle-context");
const ActionTypes = require("../action");
const Item = require("../../datastore-objects/item");

test('Generate root level hit action', () => {
    const battleContext = new BattleContext();
    const ability = new Ability({
        baseDamage: 10,
        target: 'opponent',
        animation: {}
    });

    const actions = generateAbilityActions(battleContext.player, ability.getData(), battleContext);
    let action = /** @type {ActionTypes.Action} */(actions.next().value);

    expect(action.infoAction).toBeDefined();

    action = /** @type {ActionTypes.Action} */(actions.next().value);

    expect(action.playerAction).toBeDefined();
    expect(action.playerAction?.baseDamage).toBe(10);
    expect(action.playerAction?.targetPlayer).toBe(battleContext.monster);
    expect(action.playerAction?.srcPlayer).toBe(battleContext.player);

    const lastYield = actions.next();

    expect(lastYield.done).toBeTruthy();
    expect(lastYield.value).toBeUndefined();

});

test('Revive Effect', () => {
    const battleContext = new BattleContext();
    const item = new Item({
        count: 1,
        name: 'testItem',
        customActions: {
            name: 'ReviveItem',
            data: {
                healthRecoverPercent: 0.75
            }
        },
        target: 'self'
    });

    const actions = generateMoveActions(battleContext.player, item.getData(), battleContext, {skipAnimation: true});
    let action = /** @type {ActionTypes.Action} */(actions.next().value);

    expect(action.battleContextAction).toBeDefined();
    expect(action.battleContextAction?.addEffect?.name).toMatch('Revive');
    expect(action.battleContextAction?.addEffect?.getInputData().healthRecoverPercent).toBe(0.75);
    expect(action.battleContextAction?.addEffect?.targetPlayer).toBe(battleContext.player);
});

describe.each([
    ['defenceAmp']
])('test', (stat) => {
    test('basic modding', () => {
        const battleContext = new BattleContext();
        const ability = new Ability({
            [stat]: 1,
            target: 'self',
        });

        const actions = generateAbilityActions();
    });
});
