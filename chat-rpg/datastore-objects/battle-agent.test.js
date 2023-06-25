const {BattlePlayer, BattleMonster} = require('./battle-agent');
const MAX_STAT_AMP = 12;

describe.each([
    ['attack', 'getModifiedAttack', 'attackAmp'],
    ['defence', 'getModifiedDefence', 'defenceAmp'],
    ['magic', 'getModifiedMagic', 'magicAmp'],
])('%s mod test', (stat, modFunctionName, ampFunctionName) => {
    test('Basic mod test', () => {
        const startingStat = 50;
        const player = new BattlePlayer({[stat]: startingStat});

        expect(player[modFunctionName]()).toBe(startingStat);

        player[ampFunctionName](1);

        expect(player[modFunctionName]()).toBe(startingStat + startingStat * (1 / MAX_STAT_AMP));

        const monster = new BattleMonster({[stat]: startingStat});

        expect(monster[modFunctionName]()).toBe(startingStat);

        monster[ampFunctionName](1);

        expect(monster[modFunctionName]()).toBe(startingStat + startingStat * (1 / MAX_STAT_AMP));
    });
});

test('Strike empowerment', () => {
    const player = new BattlePlayer();

    expect(player.getEmpowermentValue('strike')).toBe(0);

    player.addEmpowerment('strike', 50);

    expect(player.getEmpowermentValue('strike')).toBe(50);

    player.onStrike();

    expect(player.getEmpowermentValue('strike')).toBe(0);
});