/**
 * @import {BattleData} from '../battle-system'
 */

const seedrandom = require('seedrandom');
const BattleSteps = require('../battle-steps');
const { BattlePlayer, BattleMonster } = require('../../datastore-objects/battle-agent');
const chatRPGUtility = require('../../utility');
const gameplayObjects = require('../../gameplay-objects');
const Ability = require('../../datastore-objects/ability');
const Item = require('../../datastore-objects/item');

async function testSuccessRate(testFunc, totalAttempts = 100) {
    let passes = 0;
    for(let i = 0; i < totalAttempts; i++) {
        const testResult = await Promise.resolve(testFunc());
        if(testResult) {
            passes += 1;
        }
    }

    return passes / totalAttempts;
}

test('Damage Step', ()=>{
    const player1 = new BattlePlayer();
    player1.setStatsAtLevel(10);

    const damage = 10;
    const battleStep = BattleSteps.damage(player1, damage, 'physical');

    expect(battleStep).toBeDefined();
    expect(battleStep.type).toMatch('damage');
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
    /** @type {BattleData} */
    const battle = {
        player: new BattlePlayer().getData(),
        monster: new BattleMonster().getData(),
        gameId: '',
        strikeAnim: undefined,
        environment: undefined,
        round: 0,
        active: false,
        id: ''
    };
    const battleEndStep = BattleSteps.battleEnd(battle, 'victory', 'player', "Game Over");

    expect(battleEndStep).toBeDefined();
    expect(battleEndStep.type).toMatch('battleEnd');
    expect(battleEndStep.description).toMatch('Game Over');
});

describe.each([
    ['strength', BattleSteps.strengthAmp],
    ['defense', BattleSteps.defenseAmp],
    ['magic', BattleSteps.magicAmp],
    ['fireResist', BattleSteps.fireResistAmp],
    ['lightningResist', BattleSteps.lightningResistAmp],
    ['waterResist', BattleSteps.waterResistAmp],
    ['iceResist', BattleSteps.iceResistAmp],
    ['speed', BattleSteps.weaponSpeedAmp, true]
])('%sAmp step', (statName, ampFunction, isWeaponStat = false) => {
    test('Basic test', () => {
        const player1 = new BattlePlayer();

        const statAmpStep = ampFunction(player1, 1);

        expect(statAmpStep).toBeDefined();
        expect(statAmpStep.type).toMatch(`${statName}Amp`);

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

test('Ap Change step', () => {
    const player1 = new BattlePlayer();

    let apChangeStep = BattleSteps.apChange(player1, -2);

    expect(apChangeStep).toBeDefined();
    expect(apChangeStep.type).toMatch('apChange');
    expect(apChangeStep.netChange).toBe(-2);
    expect(player1.getData().ap).toBe(1);

    apChangeStep = BattleSteps.apChange(player1, -2);

    expect(apChangeStep.netChange).toBe(-1);
    expect(player1.getData().ap).toBe(0);

    apChangeStep = BattleSteps.apChange(player1, 1);

    expect(apChangeStep.netChange).toBe(1);
    expect(player1.getData().ap).toBe(1);

    apChangeStep = BattleSteps.apChange(player1, 3);

    expect(apChangeStep.netChange).toBe(2);
    expect(player1.getData().ap).toBe(3);

});

test('ReadyRevive Step', () => {
    const player1 = new BattlePlayer();

    let apCostStep = BattleSteps.readyRevive(player1, 0.5);

    expect(apCostStep).toBeDefined();
    expect(apCostStep.type).toMatch('readyRevive');
    expect(apCostStep.description).toMatch(`will be revived if they are defeated.`);
    expect(player1.getData().autoRevive).toBe(0.5); 
});

test('Gain and Remove Status Effect Step', () => {
    const player1 = new BattlePlayer();
    const statusEffectStep = BattleSteps.gainStatusEffect(gameplayObjects.statusEffects.ablazed, player1);
    
    expect(player1.getStatusEffect(statusEffectStep.statusEffect.name)).toStrictEqual(gameplayObjects.statusEffects.ablazed);

    const removeStatusEffectStep = BattleSteps.removeStatusEffect(gameplayObjects.statusEffects.ablazed, player1);

    expect(player1.removeStatusEffect(removeStatusEffectStep.statusEffect.name)).not.toBeDefined();
    expect(player1.removeStatusEffect(gameplayObjects.statusEffects.ablazed.name)).not.toBeDefined();
});

test('Generate Hit Steps: damage', ()=>{
    const player1 = new BattlePlayer();
    player1.setStatsAtLevel(10);
    const player2 = new BattlePlayer();
    player2.setStatsAtLevel(10);

    const baseDamage = 50;
    const hitResult = {};
    const battleSteps = BattleSteps.genHitSteps(player1, player2, baseDamage, 'physical', 'rando style', null, hitResult);

    const damage = Math.floor(chatRPGUtility.calcHitDamge(player1.getData().level, baseDamage, player1.getData().strength, player2.getData().defense));

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

    const damage = Math.floor(chatRPGUtility.calcHitDamge(player1.getData().level, baseDamage, player1.getData().strength, player2.getData().defense));

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

    const damage = Math.floor(chatRPGUtility.calcHitDamge(player1.getData().level, baseDamage, player1.getData().strength, player2.getData().defense));

    expect(battleSteps).toBeDefined();
    expect(battleSteps[0].type).toMatch('damage');
    expect(battleSteps[0].damage).toBe(hitResult.damage);
    expect(player2.getData().maxHealth - player2.getData().health).toBe(hitResult.damage);
    expect(player1.getEmpowermentValue('physical')).toBe(0);
    expect(hitResult.damage).toBeGreaterThan(damage);
});

describe.each([
    ['Ablaze', 'fire', gameplayObjects.statusEffects.ablazed, '5'],
    ['Surged', 'lightning', gameplayObjects.statusEffects.surged, '5'],
    ['Drenched', 'water', gameplayObjects.statusEffects.drenched, '5'],
])('Generate Hit Steps: %s', (statusName, element, statusEffect, randomSeed) => {
    test('Basic test', () => {
        chatRPGUtility.random = seedrandom(randomSeed);
        const player1 = new BattlePlayer({id: 'player1'});
        player1.setStatsAtLevel(10);
        const player2 = new BattlePlayer({id: 'player2'});
        player2.setStatsAtLevel(10);

        const baseDamage = 50;
        const hitResult = {};
        const battleSteps = BattleSteps.genHitSteps(player1, player2, baseDamage, 'physical', 'melee', [element], hitResult);

        expect(battleSteps).toBeDefined();
        expect(battleSteps.length).toBe(2);
        expect(battleSteps[1].type).toMatch('gainStatusEffect');
        expect(battleSteps[1].statusEffect).toStrictEqual(statusEffect);
        expect(battleSteps[1].targetId).toBe(player2.getData().id);
    });
    test('Infliction rate test', async () => {
        if(!statusEffect.inflictChance) {
            return;
        }
        const expectedRate = statusEffect.inflictChance;
        const marginOfError = 0.05;
    
        const baseDamage = 50;
        const hitResult = {};
    
        const inflictRate = await testSuccessRate(() => {
            const player1 = new BattlePlayer({id: 'player1'});
            player1.setStatsAtLevel(10);
            const player2 = new BattlePlayer({id: 'player2'});
            player2.setStatsAtLevel(10);

            const battleSteps = BattleSteps.genHitSteps(player1, player2, baseDamage, 'physical', 'melee', [element], hitResult);
            if (battleSteps.length === 2 && battleSteps[1].type === 'gainStatusEffect')
            {
                return true;
            }
    
            return false;
        }, 1000);
    
    
        expect(inflictRate).toBeGreaterThanOrEqual(expectedRate - marginOfError);
        expect(inflictRate).toBeLessThanOrEqual(expectedRate + marginOfError);
    });
});

test("Generate Hit Steps: Drench and freeze", () => {
    chatRPGUtility.random = seedrandom('1');
    const player1 = new BattlePlayer({id: 'player1'});
    player1.setStatsAtLevel(10);
    const player2 = new BattlePlayer({id: 'player2'});
    player2.setStatsAtLevel(10);

    const baseDamage = 50;
    const hitResult = {};
    let battleSteps = BattleSteps.genHitSteps(player1, player2, baseDamage, 'physical', 'melee', ['water'], hitResult);

    expect(battleSteps).toBeDefined();
    expect(battleSteps.length).toBe(2);
    expect(battleSteps[1].type).toMatch('gainStatusEffect');
    expect(battleSteps[1].statusEffect).toStrictEqual(gameplayObjects.statusEffects.drenched);
    expect(battleSteps[1].targetId).toBe(player2.getData().id);

    battleSteps = BattleSteps.genHitSteps(player1, player2, baseDamage, 'physical', 'melee', ['ice'], hitResult);

    expect(battleSteps).toBeDefined();
    expect(battleSteps.length).toBe(3);
    expect(battleSteps[2].type).toMatch('gainStatusEffect');
    expect(battleSteps[2].statusEffect).toStrictEqual(gameplayObjects.statusEffects.frozen);
    expect(battleSteps[2].targetId).toBe(player2.getData().id);
    expect(player2.getStatusEffect('drenched')).not.toBeDefined();
});

test("Generate Hit Steps: lightning on water amp", () => {
    chatRPGUtility.random = seedrandom('1');
    const player1 = new BattlePlayer({id: 'player1'});
    player1.setStatsAtLevel(10);
    const player2 = new BattlePlayer({id: 'player2'});
    player2.setStatsAtLevel(10);
    player2.addStatusEffect(gameplayObjects.statusEffects.drenched.name, gameplayObjects.statusEffects.drenched);

    const baseDamage = 50;
    const hitResult = {};
    let battleSteps = BattleSteps.genHitSteps(player1, player2, baseDamage, 'physical', 'melee', [], hitResult);
    const oldDamage = hitResult.damage;

    battleSteps = BattleSteps.genHitSteps(player1, player2, baseDamage, 'physical', 'melee', ['lightning'], hitResult);

    const newDamage = Math.floor(oldDamage * (1+gameplayObjects.statusEffects.drenched.lightningAmp));
    expect(hitResult.damage).toBeLessThanOrEqual(newDamage + 1);
    expect(hitResult.damage).toBeGreaterThan(newDamage);
});

test('Generate Hit Steps: override damage modifier', () => {
    const player1 = new BattlePlayer();
    player1.setStatsAtLevel(10);
    player1.getData().strength = 0;
    const player2 = new BattlePlayer();
    player2.setStatsAtLevel(10);

    const baseDamage = 50;
    const hitResult = {};
    const battleSteps = BattleSteps.genHitSteps(player1, player2, baseDamage, 'physical', 'sword', null, hitResult, {overrideDamageModifier: 'defense'});

    expect(battleSteps).toBeDefined();
    expect(battleSteps[0].type).toMatch('damage');
    expect(battleSteps[0].damage).toBeGreaterThan(2);
});

test('Generate Hit Steps: defense pen', () => {
    const player1 = new BattlePlayer();
    player1.setStatsAtLevel(10);
    const player2 = new BattlePlayer();
    player2.setStatsAtLevel(10);
    player2.getData().defense = 1000000000;

    const baseDamage = 50;
    const hitResult = {};
    const battleSteps = BattleSteps.genHitSteps(player1, player2, baseDamage, 'physical', 'sword', null, hitResult, {defensePen: 0.999999999});

    expect(battleSteps).toBeDefined();
    expect(battleSteps[0].type).toMatch('damage');
    expect(battleSteps[0].damage).toBeGreaterThan(2);
});

test('Freeze Rate', async () => {
    const expectedRate = gameplayObjects.statusEffects.frozen.drenchedInflict;
    const marginOfError = 0.05;
    const baseDamage = 50;
    const hitResult = {};

    const inflictRate = await testSuccessRate(() => {
        const player1 = new BattlePlayer();
        player1.setStatsAtLevel(10);
        const player2 = new BattlePlayer();
        player2.setStatsAtLevel(10);

        BattleSteps.genHitSteps(player1, player2, baseDamage, 'physical', 'melee', ['water'], hitResult);
        const battleSteps = BattleSteps.genHitSteps(player1, player2, baseDamage, 'physical', 'melee', ['ice'], hitResult);
        if (battleSteps.length === 3 && battleSteps[2].type === 'gainStatusEffect')
        {
            return true;
        }

        return false;
    }, 1000);

    expect(inflictRate).toBeGreaterThanOrEqual(expectedRate - marginOfError);
    expect(inflictRate).toBeLessThanOrEqual(expectedRate + marginOfError);
});

describe.each([
    ['physical'],
    ['magical']
])('%s protection step', (protectionType) => {
    test('Basic test', () => {
        const player1 = new BattlePlayer();

        const empowermentStep = BattleSteps.protection(player1, protectionType, 50);
        
        expect(empowermentStep).toBeDefined();
        expect(empowermentStep.type).toMatch('protection');
        expect(empowermentStep.description).toMatch(new RegExp(`${protectionType}`));
        expect(player1.getData().protection[protectionType]).toBe(Math.floor(player1.getData().maxHealth/2));
    });
});

test('Adding and removing abilities', () => {
    const player1 = new BattlePlayer({id: 'player'});
    const ability = new Ability({name: 'test'});

    const addAbilityStep = BattleSteps.addAbility(player1, ability);

    expect(addAbilityStep.type).toBe('addAbility');
    expect(addAbilityStep.ability).toStrictEqual(ability.getData());
    expect(addAbilityStep.targetId).toBe(player1.getData().id);

    const removeAblityStep = BattleSteps.removeAbility(player1, ability.getData().name);

    expect(removeAblityStep.type).toBe('removeAblity');
    expect(removeAblityStep.ability).toStrictEqual(ability.getData());
    expect(removeAblityStep.targetId).toBe(player1.getData().id);
});

test('Adding and removing Imbue', () => {
    //TODO test to make sure the imbue works
    const player1 = new BattlePlayer({id: 'player'});

    const imbueStep = BattleSteps.imbue(player1, 'fire');

    expect(imbueStep.type).toBe('imbue');
    expect(imbueStep.targetId).toStrictEqual(player1.getData().id);
    expect(imbueStep.element).toBe('fire');

    const removeImbueStep = BattleSteps.removeImbue(player1, 'fire');

    expect(removeImbueStep.type).toBe('removeImbue');
    expect(removeImbueStep.targetId).toBe(player1.getData().id);
    expect(removeImbueStep.element).toBe('fire');
});

test('Set counter', () => {
    const player1 = new BattlePlayer({id: 'player'});
    const ability = new Ability({name: 'test'});
    const counterStep = BattleSteps.setCounter(player1, ability, 'strike');

    expect(counterStep.type).toBe('setCounter');
    expect(counterStep.targetId).toBe(player1.getData().id);
    expect(counterStep.counter).toStrictEqual({type: 'strike', ability: ability.getData()});
});

test('Strike Level change', () => {
    const player = new BattlePlayer({id: 'player'});
    let strikeLevelChange = BattleSteps.strikeLevelChange(player, 1);

    expect(strikeLevelChange).toBeDefined();
    expect(strikeLevelChange.type).toMatch('strikeLevelChange');
    expect(strikeLevelChange.targetId).toMatch('player');
    expect(strikeLevelChange.netChange).toBe(1);
    expect(player.getData().strikeLevel).toBe(1);

    strikeLevelChange = BattleSteps.strikeLevelChange(player, 1);

    expect(strikeLevelChange).toBeDefined();
    expect(strikeLevelChange.type).toMatch('strikeLevelChange');
    expect(strikeLevelChange.targetId).toMatch('player');
    expect(strikeLevelChange.netChange).toBe(1);
    expect(player.getData().strikeLevel).toBe(2);

    strikeLevelChange = BattleSteps.strikeLevelChange(player, 1);

    expect(strikeLevelChange).toBeDefined();
    expect(strikeLevelChange.type).toMatch('strikeLevelChange');
    expect(strikeLevelChange.targetId).toMatch('player');
    expect(strikeLevelChange.netChange).toBe(0);
    expect(player.getData().strikeLevel).toBe(2);

});

test("Consume Item", () => {
    const item = new Item({
        name: 'testItem',
        count: 2
    });

    const player = new BattlePlayer({id: "player"});
    const itemEntry = player.addItemToBag(item);
    if(!itemEntry) {
        fail();
    }

    let stepInfo = BattleSteps.consumeItem(player, 'testItem');

    expect(stepInfo.type).toBe('consumeItem');
    expect(stepInfo.targetId).toBe('player');
    expect(stepInfo.itemName).toBe('testItem');
    expect(stepInfo.successful).toBe(true);
    expect(stepInfo.itemDepleted).toBe(false);

    let itemContainer = player.findObjectInBag(itemEntry.id);
    if(!itemContainer) {
        fail();
    }

    const itemData = /** @type {import('../../datastore-objects/item').ItemData} */ (itemContainer.content);

    expect(itemData.count).toBe(1);

    stepInfo = BattleSteps.consumeItem(player, 'testItem');

    expect(stepInfo.type).toBe('consumeItem');
    expect(stepInfo.targetId).toBe('player');
    expect(stepInfo.itemName).toBe('testItem');
    expect(stepInfo.successful).toBe(true);
    expect(stepInfo.itemDepleted).toBe(true);
    expect(player.findObjectInBag(itemEntry.id)).toBeUndefined();

    stepInfo = BattleSteps.consumeItem(player, 'testItem');

    expect(stepInfo.type).toBe('consumeItem');
    expect(stepInfo.targetId).toBe('player');
    expect(stepInfo.itemName).toBe('testItem');
    expect(stepInfo.successful).toBe(false);
    expect(stepInfo.itemDepleted).toBe(false);
});