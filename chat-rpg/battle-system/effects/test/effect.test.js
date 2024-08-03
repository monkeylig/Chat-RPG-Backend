const { EffectsLibrary } = require("../effects");

describe.each([
    ['ReviveEffect'],
    ['EmpowermentEffect'],
    ['AblazedEffect'],
    ['SurgedEffect'],
    ['DrenchedEffect'],
    ['AbilityStrikeEffect'],
])('%s test', (effectClass) => {
    test('Discovery', () => {
        expect(EffectsLibrary[effectClass]).toBeDefined();
    });
});