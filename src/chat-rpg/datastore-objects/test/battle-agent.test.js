const Ability = require('../ability');
const {BattlePlayer, BattleMonster, BattleWeapon} = require('../battle-agent');
const MAX_STAT_AMP = 12;

const statAmpTable = {
    '-1': 0.80,
    '0': 1,
    '1': 1.25,
};

describe.each([
    ['strength', 'getModifiedStrength', 'strengthAmp'],
    ['defense', 'getModifiedDefense', 'defenseAmp'],
    ['magic', 'getModifiedMagic', 'magicAmp'],
    ['fireResist', 'getModifiedFireResist', 'fireResistAmp'],
    ['lightningResist', 'getModifiedLightningResist', 'lightningResistAmp'],
    ['waterResist', 'getModifiedWaterResist', 'waterResistAmp'],
    ['iceResist', 'getModifiedIceResist', 'iceResistAmp'],
])('%s mod test', (stat, modFunctionName, ampFunctionName) => {
    test('Basic mod test', () => {
        const startingStat = 50;
        const player = new BattlePlayer({[stat]: startingStat});

        expect(player[modFunctionName]()).toBe(startingStat);

        player[ampFunctionName](1);

        expect(player[modFunctionName]()).toBe(startingStat * statAmpTable[1]);

        player[ampFunctionName](-2);

        expect(player[modFunctionName]()).toBe(startingStat * statAmpTable[-1]);

        const monster = new BattleMonster({[stat]: startingStat});

        expect(monster[modFunctionName]()).toBe(startingStat);

        monster[ampFunctionName](1);

        expect(monster[modFunctionName]()).toBe(startingStat * statAmpTable[1]);

        monster[ampFunctionName](-2);

        expect(monster[modFunctionName]()).toBe(startingStat * statAmpTable[-1]);
    });
});

describe.each([
    ['physical'],
    ['magical']
])('%s protection', (protectionType) => {
    test('Basic test', () => {
        const player = new BattlePlayer();
        player.setStatsAtLevel(20);
        player.addProtection(protectionType, 10);

        expect(player.getProtectionValue(protectionType)).toBe(10);

        player.dealDamage(player.getData().protection[protectionType] + 5, protectionType);

        expect(player.getData().health).toBe(player.getData().maxHealth - 5);
    })
});

test('Evasive Speed', () => {
    const player = new BattlePlayer();
    
    player.setEvasiveSpeed(-1);

    expect(player.getData().evasion).toBe(0);

    player.setEvasiveSpeed(0);

    expect(player.getData().evasion).toBe(0);

    player.setEvasiveSpeed(5);

    expect(player.getData().evasion).toBe(0.15);

    player.setEvasiveSpeed(10);

    expect(player.getData().evasion).toBe(0.3);

    player.setEvasiveSpeed(20);

    expect(player.getData().evasion).toBe(0.6);
});

test('Calculate Strike Ability cost', () => {
    const player = new BattlePlayer();

    expect(player.getStrikeAbilityCost()).toBe(2);

    player.getData().strikeLevel = 1;

    expect(player.getStrikeAbilityCost()).toBe(1);

    player.getData().strikeLevel = 2;

    expect(player.getStrikeAbilityCost()).toBe(0);

    player.getData().strikeLevel = 3;

    expect(player.getStrikeAbilityCost()).toBe(0);

    player.getData().strikeLevel = 300;

    expect(player.getStrikeAbilityCost()).toBe(0);

});
