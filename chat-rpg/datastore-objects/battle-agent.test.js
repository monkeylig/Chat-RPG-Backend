const Ability = require('./ability');
const {BattlePlayer, BattleMonster, BattleWeapon} = require('./battle-agent');
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

test('Gain Status Effects', () => {
    const player = new BattlePlayer();
    const inflamed = {
        name: 'inflamed',
        turns: 5
    };

    player.addStatusEffect(inflamed.name, inflamed);
    let statusEffect = player.getStatusEffect(inflamed.name);

    expect(statusEffect).toBeDefined();
    expect(statusEffect).toStrictEqual(inflamed);

    const noEffect = player.getStatusEffect('random');

    expect(noEffect).not.toBeDefined();

    player.removeStatusEffect(inflamed.name);
    statusEffect = player.getStatusEffect(inflamed.name);

    expect(statusEffect).not.toBeDefined();
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

test("Add Ability Strike", () => {
    const player = new BattlePlayer();

    const ability1 = new Ability({name: "ability1"});
    const ability2 = new Ability({name: "ability2"});
    const ability3 = new Ability({name: "ability3"});

    player.addAbilityStrike(ability1, {type: 'strikes', value: 2});
    player.addAbilityStrike(ability2, {type: 'strikes', value: 2});
    player.addAbilityStrike(ability3, {type: 'strikes', value: 2});

    const abilityStrikes = player.getAbilityStrikes();

    expect(abilityStrikes.length).toBe(3);
    expect(abilityStrikes[0].ability.name).toBe("ability1");
    expect(abilityStrikes[0].durationCondition.type).toBe("strikes");
    expect(abilityStrikes[0].durationCondition.value).toBe(2);
    expect(abilityStrikes[1].ability.name).toBe("ability2");
    expect(abilityStrikes[1].durationCondition.type).toBe("strikes");
    expect(abilityStrikes[1].durationCondition.value).toBe(2);
    expect(abilityStrikes[2].ability.name).toBe("ability3");
    expect(abilityStrikes[2].durationCondition.type).toBe("strikes");
    expect(abilityStrikes[2].durationCondition.value).toBe(2);

    player.removeAbilityStrike(1);

    expect(abilityStrikes.length).toBe(2);
    expect(abilityStrikes[0].ability.name).toBe("ability1");
    expect(abilityStrikes[0].durationCondition.type).toBe("strikes");
    expect(abilityStrikes[0].durationCondition.value).toBe(2);
    expect(abilityStrikes[1].ability.name).toBe("ability3");
    expect(abilityStrikes[1].durationCondition.type).toBe("strikes");
    expect(abilityStrikes[1].durationCondition.value).toBe(2);
});

test("Counters", () => {
    const player = new BattlePlayer();

    const ability = new Ability({name: "counter ability"});
    player.setCounter(ability, 'strike');
    const counterAbility = player.getCounter('strike');

    expect(player.getCounter('random')).not.toBeDefined();
    expect(counterAbility).toBeDefined();
    expect(counterAbility.type).toBe('strike');
    expect(counterAbility.ability.name).toBe('counter ability');

    player.clearCounter();

    expect(player.getCounter('strike')).not.toBeDefined();
});

test('Imbue Weapon', () => {
    const weapon = new BattleWeapon();

    weapon.imbue('fire');
    weapon.imbue('lightning', 'strikeAbility');
    let elements = weapon.getImbuedElements();

    expect(elements.length).toBe(2);
    expect(elements[0]).toBe('fire');
    expect(elements[1]).toBe('lightning');
    expect(weapon.getData().imbuements['fire'].durationCondition).toBeNull();
    expect(weapon.getData().imbuements['lightning'].durationCondition).toBe('strikeAbility');

    weapon.removeImbue('fire');
    elements = weapon.getImbuedElements();

    expect(weapon.getData().imbuements['fire']).toBeNull();
    expect(elements.length).toBe(1);
    expect(elements[0]).toBe('lightning');
});