const AbilityFunctions = require('./ability-functions');
const Ability = require('../datastore-objects/ability');
const { BattlePlayer } = require('../datastore-objects/battle-agent');

describe.each([
    ['damage', {baseDamage: 50}],
    ['damage', {baseDamage: 50, overrideDamageModifier: 'defence'}],
    ['damage', {baseDamage: 50, defencePen: 0.5}],
    ['heal', {baseDamage: 50, absorb: 0.5}, 1],
    ['damage', {baseDamage: 50, recoil: 0.5}],
    ['strengthAmp', {strengthAmp: 1}],
    ['defenceAmp', {defenceAmp: 1}],
    ['magicAmp', {magicAmp: 1}],
    ['speedAmp', {weaponSpeedAmp: 1}],
    ['empowerment', {empowerment: {pysical: 50}}],
    ['empowerment', {empowerment: {magical: 50}}],
    ['gainStatusEffect', {inflameChance: 1}],
    ['protection', {protection: {pysical: 50}}],
    ['protection', {protection: {magical: 50}}],
    ['addAbility', {addAbilities: [{name: 'ability'}]}],
    ['addAbility', {addAbilities: [{name: 'ability1'}, {name: 'ability2'}]}, 1],
    ['imbue', {imbue: ['fire']}],
    ['imbue', {imbue: ['fire', 'lightning']}, 1],
])('Simple %s step test', (stepType, abilityData, stepIndex = 0) => {
    test('Smoke test', () => {
        const ability = new Ability(abilityData);
        const player1 = new BattlePlayer();
        const player2 = new BattlePlayer();
        player1.setStatsAtLevel(50);
        player2.setStatsAtLevel(50);

        let steps = AbilityFunctions.standardSteps(ability, {}, player1, player2);

        expect(steps.length).toBeGreaterThan(0);
        expect(steps[stepIndex].type).toMatch(stepType);
    });
});

//TODO Add inflame chance rate test