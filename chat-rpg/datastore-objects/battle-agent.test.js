const Ability = require('./ability');
const {BattlePlayer, BattleMonster} = require('./battle-agent');
const MAX_STAT_AMP = 12;

const statAmpTable = {
    '-12': 0.25,
    '-11': 0.2675,
    '-10': 0.285,
    '-9': 0.3075,
    '-8': 0.33,
    '-7': 0.365,
    '-6': 0.4,
    '-5': 0.45,
    '-4': 0.5,
    '-3': 0.58,
    '-2': 0.66,
    '-1': 0.83,
    '0': 1,
    '1': 1.25,
    '2': 1.5,
    '3': 1.75,
    '4': 2,
    '5': 2.25,
    '6': 2.5,
    '7': 2.75,
    '8': 3,
    '9': 3.25,
    '10': 3.5,
    '11': 3.75,
    '12': 4
};

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