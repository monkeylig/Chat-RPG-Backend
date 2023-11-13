const Ability = require("./ability");

test('Has element', () => {
    const ability = new Ability();

    expect(ability.hasElement('fire')).toBeFalsy();

    ability.getData().elements.push('fire');

    expect(ability.hasElement('fire')).toBeTruthy();
});
