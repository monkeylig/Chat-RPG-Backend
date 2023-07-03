const { BattlePlayer } = require('../datastore-objects/battle-agent');
const Item = require('../datastore-objects/item');
const ItemFunctions = require('./item-functions');

describe.each([
    ['heal', {heal: 30}]
])('Simple %s step test', (stepType, itemData, stepIndex = 0) => {
    test('Smoke test', () => {
        const item = new Item(itemData);
        const player1 = new BattlePlayer();
        const player2 = new BattlePlayer();
        player1.setStatsAtLevel(50);
        player2.setStatsAtLevel(50);

        let steps = ItemFunctions.standardBattleSteps(item.getData(), player1, player2);

        expect(steps.length).toBeGreaterThan(0);
        expect(steps[stepIndex].type).toMatch(stepType);
    });
});