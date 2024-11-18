const { EffectsLibrary } = require("../effects");

describe.each([
    ['ReviveEffect'],
    ['EmpowermentEffect'],
    ['AblazedEffect'],
    ['SurgedEffect'],
    ['DrenchedEffect'],
    ['FrozenEffect'],
    ['AbilityStrikeEffect'],
    ['ImbueEffect'],
    ['CounterEffect'],
    ['ElementalBoost'],
    ['StrikeAbilitySurgeEffect'],
    ['MultiTriggerEffect'],
    ['ActionTriggerEffect']
])('%s test', (effectClass) => {
    test('Discovery', () => {
        expect(EffectsLibrary[effectClass]).toBeDefined();
    });
});