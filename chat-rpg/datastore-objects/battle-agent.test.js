const Ability = require('./ability');
const {BattlePlayer, BattleMonster, BattleAgent} = require('./battle-agent');
const MAX_STAT_AMP = 12;

describe.each([
    ['strength', 'getModifiedStrength', 'strengthAmp'],
    ['defence', 'getModifiedDefence', 'defenceAmp'],
    ['magic', 'getModifiedMagic', 'magicAmp'],
])('%s mod test', (stat, modFunctionName, ampFunctionName) => {
    test('Basic mod test', () => {
        const startingStat = 50;
        const player = new BattlePlayer({[stat]: startingStat});

        expect(player[modFunctionName]()).toBe(startingStat);

        player[ampFunctionName](1);

        expect(player[modFunctionName]()).toBe(startingStat * BattleAgent.statAmpTable[1]);

        player[ampFunctionName](-2);

        expect(player[modFunctionName]()).toBe(startingStat * BattleAgent.statAmpTable[-1]);

        const monster = new BattleMonster({[stat]: startingStat});

        expect(monster[modFunctionName]()).toBe(startingStat);

        monster[ampFunctionName](1);

        expect(monster[modFunctionName]()).toBe(startingStat * BattleAgent.statAmpTable[1]);

        monster[ampFunctionName](-2);

        expect(monster[modFunctionName]()).toBe(startingStat * BattleAgent.statAmpTable[-1]);
    });
});

describe.each([
    ['physical'],
    ['magical']
])('%s empowerment', (empowermentType) => {
    test('Strikes', () => {
        const player = new BattlePlayer({weapon: {type: empowermentType}});
    
        expect(player.getEmpowermentValue(empowermentType)).toBe(0);
    
        player.addEmpowerment(empowermentType, 50);
    
        expect(player.getEmpowermentValue(empowermentType)).toBe(50);
        expect(player.consumeEmpowermentValue(empowermentType)).toBe(50);
        expect(player.getEmpowermentValue(empowermentType)).toBe(0);
        expect(player.consumeEmpowermentValue(empowermentType)).toBe(0);
    });
});