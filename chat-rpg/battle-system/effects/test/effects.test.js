const { EffectsLibrary } = require("../effects");

describe.each([
    ['ReviveEffect'],
    ['EmpowermentEffect'],
    ['AblazedEffect'],
    ['SurgedEffect'],
    ['DrenchedEffect'],
    ['AbilityStrikeEffect'],
    ['ImbueEffect'],
    ['FrozenEffect'],
    ['CounterEffect'],
])('%s test', (effectClass) => {
    test('Discovery', () => {
        expect(EffectsLibrary[effectClass]).toBeDefined();
    });
});