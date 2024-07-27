const { EffectsLibrary } = require("../effects");

describe.each([
    ['ReviveEffect'],
    ['EmpowermentEffect'],
    ['AblazedEffect'],
    ['SurgedEffect'],
    ['AbilityStrikeEffect']
])('%s test', (effectClass) => {
    test('Discovery', () => {
        expect(EffectsLibrary[effectClass]).toBeDefined();
    });
});