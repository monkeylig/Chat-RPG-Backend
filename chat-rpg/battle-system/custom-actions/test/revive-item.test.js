const Item = require("../../../datastore-objects/item");
const { BattleContext } = require("../../battle-context");
const { ReviveEffect } = require("../../effects/revive-effect");
const { generateActions } = require("../revive-item");

test('Item Actions', () => {
    const battleContext = new BattleContext();
    const reviveItem = new Item({
        count: 1,
        name: 'testItem',
        target: 'self'
    });

    const inputData = {
        healthRecoverPercent: 0.75
    };

    const actions = generateActions(battleContext.player, reviveItem.getData(), inputData, battleContext);
    let action = actions.next().value;

    if (!action ||
        !action.battleContextAction || 
        !action.battleContextAction.addEffect) {
        fail();
    }

    expect(action.battleContextAction.addEffect.name).toMatch("Revive");
    expect(action.battleContextAction.addEffect.targetPlayer).toBe(battleContext.player);
    expect(action.battleContextAction.addEffect.getInputData()).toStrictEqual(inputData);

    const lastYield = actions.next();

    expect(lastYield.done).toBeTruthy();

});

test('Item Not Ready', () => {
    const battleContext = new BattleContext();
    const reviveEffect = new ReviveEffect(battleContext.player);
    battleContext.player.setEffect(reviveEffect.persistentId, reviveEffect.name, reviveEffect.getInputData());
    const reviveItem = new Item({
        count: 1,
        name: 'testItem',
        target: 'self'
    });

    const inputData = {
        healthRecoverPercent: 0.75
    };

    const actions = generateActions(battleContext.player, reviveItem.getData(), inputData, battleContext);
    let action = actions.next().value;

    if (!action ||
        !action.infoAction || 
        !action.infoAction.action) {
        fail();
    }

    expect(action.infoAction.action).toMatch('itemNotReady');
    expect(action.infoAction.targetAgentId).toMatch('player');
    expect(action.infoAction.srcAgentId).toMatch('player');

    const lastYield = actions.next();

    expect(lastYield.done).toBeTruthy();
});