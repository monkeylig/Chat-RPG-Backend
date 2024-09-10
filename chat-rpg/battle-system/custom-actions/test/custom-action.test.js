const CustomActions = require("../custom-actions");

describe.each([
    ['Revive'],
    ['NoApDamageBoost'],
    ['MultiHitAttack'],
    ['HealthBasedDamage'],
    ['SpeedDamageBoost'],
    ['RoundDamageBoost'],
    ['ProtectionAttack'],
    ['EffectBoost'],
    ['IsHealthFull'],
    ['RestoreAP'],
])('%s registry', (name) => {
    test('Discoverable', () => {
        expect(CustomActions[name]).toBeDefined();
        expect(CustomActions[name].generateActions).toBeDefined();
    });
})