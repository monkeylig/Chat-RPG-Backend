const BattleSteps = require('./battle-steps');
const { BattlePlayer } = require('./datastore-objects/battle-agent');
const chatRPGUtility = require('./utility');

test('Damage Step', ()=>{
    const player1 = new BattlePlayer();
    player1.setStatsAtLevel(10);

    const damage = 10;
    const battleStep = BattleSteps.damage(player1, damage);

    expect(battleStep).toBeDefined();
    expect(battleStep.type).toMatch('damage');

    //const damage = Math.floor(((2 * player1.getData().level / 5 + 2) * baseDamage * player1.getData().strength / player2.getData().defence) / 50 + 2);

    expect(battleStep.damage).toBe(damage);
    expect(player1.getData().maxHealth - player1.getData().health).toBe(damage);
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
    const animation = {name: 'cool animation'}
    const infoStep = BattleSteps.info("testing", 'test action', 'testID', 'targetID', animation);

    expect(infoStep).toBeDefined();
    expect(infoStep.type).toMatch('info');
    expect(infoStep.description).toMatch('testing');
    expect(infoStep.action).toMatch('test action');
    expect(infoStep.actorId).toMatch('testID');
    expect(infoStep.targetId).toMatch('targetID');
    expect(infoStep.animation).toStrictEqual(animation);
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
    player1.getData().autoRevive = 0.5;
    const reviveStep = BattleSteps.revive(player1);

    expect(reviveStep).toBeDefined();
    expect(reviveStep.type).toMatch('revive');
    expect(reviveStep.healAmount).toBeGreaterThan(0);
    expect(player1.getData().health).toBeGreaterThan(0);
});

test('ApCost step', () => {
    const player1 = new BattlePlayer();

    let apCostStep = BattleSteps.apCost(player1, 2);

    expect(apCostStep).toBeDefined();
    expect(apCostStep.type).toMatch('apCost');
    expect(apCostStep.apCost).toBe(2);
    expect(player1.getData().ap).toBe(1);

    apCostStep = BattleSteps.apCost(player1, 2);

    expect(apCostStep.apCost).toBe(1);
    expect(player1.getData().ap).toBe(0);
});

test('ReadyRevive Step', () => {
    const player1 = new BattlePlayer();

    let apCostStep = BattleSteps.readyRevive(player1, 0.5);

    expect(apCostStep).toBeDefined();
    expect(apCostStep.type).toMatch('readyRevive');
    expect(apCostStep.description).toMatch(`will be revived if they are defeated.`);
    expect(player1.getData().autoRevive).toBe(0.5); 
});

test('Generate Hit Steps: damage', ()=>{
    const player1 = new BattlePlayer();
    player1.setStatsAtLevel(10);
    const player2 = new BattlePlayer();
    player2.setStatsAtLevel(10);

    const baseDamage = 50;
    const hitResult = {};
    const battleSteps = BattleSteps.genHitSteps(player1, player2, baseDamage, 'physical', 'rando style', null, hitResult);

    const damage = Math.floor(chatRPGUtility.calcHitDamge(player1.getData().level, baseDamage, player1.getData().strength, player2.getData().defence));

    expect(battleSteps).toBeDefined();
    expect(battleSteps[0].type).toMatch('damage');
    expect(battleSteps[0].damage).toBe(damage);
    expect(battleSteps[0].damage).toBe(hitResult.damage);
    expect(player2.getData().maxHealth - player2.getData().health).toBe(hitResult.damage);
});

test('Generate Hit Steps: empowerment', () => {
    const player1 = new BattlePlayer();
    player1.setStatsAtLevel(10);
    player1.addEmpowerment('physical', 50);
    const player2 = new BattlePlayer();
    player2.setStatsAtLevel(10);

    const baseDamage = 50;
    const hitResult = {};
    const battleSteps = BattleSteps.genHitSteps(player1, player2, baseDamage, 'physical', 'rando style', null, hitResult);

    const damage = Math.floor(chatRPGUtility.calcHitDamge(player1.getData().level, baseDamage, player1.getData().strength, player2.getData().defence));

    expect(battleSteps).toBeDefined();
    expect(battleSteps[0].type).toMatch('damage');
    expect(battleSteps[0].damage).toBe(hitResult.damage);
    expect(player2.getData().maxHealth - player2.getData().health).toBe(hitResult.damage);
    expect(player1.getEmpowermentValue('physical')).toBe(0);
    expect(hitResult.damage).toBeGreaterThan(damage);
});

test('Generate Hit Steps: weapon synergy', () => {
    const player1 = new BattlePlayer();
    player1.setStatsAtLevel(10);
    const player2 = new BattlePlayer();
    player2.setStatsAtLevel(10);

    const baseDamage = 50;
    const hitResult = {};
    const battleSteps = BattleSteps.genHitSteps(player1, player2, baseDamage, 'physical', 'melee', null, hitResult);

    const damage = Math.floor(chatRPGUtility.calcHitDamge(player1.getData().level, baseDamage, player1.getData().strength, player2.getData().defence));

    expect(battleSteps).toBeDefined();
    expect(battleSteps[0].type).toMatch('damage');
    expect(battleSteps[0].damage).toBe(hitResult.damage);
    expect(player2.getData().maxHealth - player2.getData().health).toBe(hitResult.damage);
    expect(player1.getEmpowermentValue('physical')).toBe(0);
    expect(hitResult.damage).toBeGreaterThan(damage);
});