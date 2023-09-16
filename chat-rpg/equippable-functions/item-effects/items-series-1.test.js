const { BattlePlayer } = require("../../datastore-objects/battle-agent");
const Item = require("../../datastore-objects/item");
const ItemEffects = require("./item-effects");

test('Potion', () => {
    expect(ItemEffects.potion).toBeDefined();
    expect(ItemEffects.potion.isReady).toBeDefined();
    expect(ItemEffects.potion.notReadyMessage).toBeDefined();

    const player = new BattlePlayer();
    const item = new Item();

    expect(ItemEffects.potion.isReady(item, {}, player, {})).toBeFalsy();

    player.getData().health = player.getData().maxHealth - 1;

    expect(ItemEffects.potion.isReady(item, {}, player, {})).toBeTruthy();
});

test('Peonix Down', () => {
    expect(ItemEffects.pheonixDown).toBeDefined();
    expect(ItemEffects.pheonixDown.isReady).toBeDefined();
    expect(ItemEffects.pheonixDown.notReadyMessage).toBeDefined();
    expect(ItemEffects.pheonixDown.onBattleActivate).toBeDefined();

    const player = new BattlePlayer();
    const item = new Item();

    expect(ItemEffects.pheonixDown.isReady(item, {}, player, {})).toBeTruthy();

    const battleSteps = ItemEffects.pheonixDown.onBattleActivate(item, {}, player, {}, {});

    expect(battleSteps).toBeDefined();
    expect(battleSteps.length).toBe(1);
    expect(battleSteps[0].type).toBe('readyRevive');
    
    expect(player.getData().reviveReady).toBeTruthy();
});