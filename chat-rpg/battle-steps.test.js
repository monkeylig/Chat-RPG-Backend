const BattleSteps = require('./battle-steps');
const { BattlePlayer } = require('./datastore-objects/battle-agent');

test('Damage Step', ()=>{
    const player1 = new BattlePlayer();
    player1.setStatsAtLevel(10);
    const player2 = new BattlePlayer();
    player2.setStatsAtLevel(10);

    const baseDamage = 50;
    const battleStep = BattleSteps.damage(player1, player2, 50, 'physical');

    expect(battleStep).toBeDefined();
    expect(battleStep.type).toMatch('damage');

    const damage = Math.floor(((2 * player1.getData().level / 5 + 2) * baseDamage * player1.getData().strength / player2.getData().defence) / 50 + 2);

    expect(battleStep.damage).toBe(damage);
    expect(player2.getData().maxHealth - player2.getData().health).toBe(damage);
});

test('Heal Step', ()=>{
    const player1 = new BattlePlayer();
    player1.setStatsAtLevel(10);

    player1.getData().health = player1.getData().maxHealth / 2;

    const healStep = BattleSteps.heal(player1, player1, player1.getData().maxHealth);

    expect(healStep).toBeDefined();
    expect(healStep.type).toMatch('heal');
    expect(healStep.healAmount).toBeGreaterThan(0);
    expect(player1.getData().health).toBe(player1.getData().maxHealth);
});

test('Info Step', ()=>{
    const infoStep = BattleSteps.info("testing", 'test action', 'testID');

    expect(infoStep).toBeDefined();
    expect(infoStep.type).toMatch('info');
    expect(infoStep.description).toMatch('testing');
    expect(infoStep.action).toMatch('test action');
    expect(infoStep.actorId).toMatch('testID');
});

test('Battle End', ()=>{
    const battleEndStep = BattleSteps.battleEnd("Game Over");

    expect(battleEndStep).toBeDefined();
    expect(battleEndStep.type).toMatch('battle_end');
    expect(battleEndStep.description).toMatch('Game Over');
});

describe.each([
    ['strength', BattleSteps.strengthAmp],
    ['defence', BattleSteps.defenceAmp],
    ['magic', BattleSteps.magicAmp],
    ['speed', BattleSteps.weaponSpeedAmp, true]
])('%sAmp step', (statName, ampFunction, isWeaponStat) => {
    test('Basic test', () => {
        const player1 = new BattlePlayer();

        const statAmpStep = ampFunction(player1, 1);

        expect(statAmpStep).toBeDefined();
        expect(statAmpStep.type).toMatch(`${statName}Amp`);
        expect(statAmpStep.description).toMatch(new RegExp(`${statName}`));

        if(!isWeaponStat) {
            expect(player1.getData()[`${statName}Amp`]).toBe(1);
        }
        else {
            expect(player1.getData().weapon[`${statName}Amp`]).toBe(1);
        }
    });
});

describe.each([
    ['physical'],
    ['magical']
])('%s empowerment step', (empowermentType) => {
    test('Basic test', () => {
        const player1 = new BattlePlayer();

        const empowermentStep = BattleSteps.empowerment(player1, empowermentType, 50);
        
        expect(empowermentStep).toBeDefined();
        expect(empowermentStep.type).toMatch('empowerment');
        expect(empowermentStep.description).toMatch(new RegExp(`${empowermentType}`));
        expect(player1.getData().empowerment[empowermentType]).toBe(50);
    });
});

test('Revive step', () => {
    const player1 = new BattlePlayer();

    player1.getData().health = 0;
    const reviveStep = BattleSteps.revive(player1);

    expect(reviveStep).toBeDefined();
    expect(reviveStep.type).toMatch('revive');
    expect(reviveStep.healAmount).toBeGreaterThan(0);
    expect(player1.getData().health).toBeGreaterThan(0);
});