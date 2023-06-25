const AbilityFunctions = require('./ability-functions');
const Ability = require('../datastore-objects/ability');
const { BattlePlayer } = require('../datastore-objects/battle-agent');

describe.each([
    ['damage', {baseDamage: 50}],
    ['attackAmp', {attackAmp: 1}],
    ['defenceAmp', {defenceAmp: 1}],
    ['speedAmp', {weaponSpeedAmp: 1}],
    ['empowerment', {empowerment: {strike: 50}}]
])('Simple %s step test', (stepType, abilityData) => {
    test('Smoke test', () => {
        const ability = new Ability(abilityData);
        const player1 = new BattlePlayer();
        const player2 = new BattlePlayer();
        player1.setStatsAtLevel(50);
        player2.setStatsAtLevel(50);


        let steps = AbilityFunctions.standardSteps(ability, {}, player1, player2);

        expect(steps.length).toBeGreaterThan(0);
        expect(steps[0].type).toMatch(stepType);
    });
});