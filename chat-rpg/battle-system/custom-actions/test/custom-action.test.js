const CustomActions = require("../custom-actions");

describe.each([
    ['Revive'],
    ['NoApDamageBoost'],
    ['MultiHitAttack'],
    ['HealthBasedDamage'],
    ['SpeedDamageBoost'],
    ['ProtectionAttack'],
    ['EffectBoost']
])('%s registry', (name) => {
    test('Discoverable', () => {
        expect(CustomActions[name]).toBeDefined();
        expect(CustomActions[name].generateActions).toBeDefined();
    });
})