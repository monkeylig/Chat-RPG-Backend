/**
 * @import {Action} from '../action'
 * @import {StrikeBattleMoveData} from '../strike-battle-move'
 * @import {AddEffectStep, DamageStep} from '../battle-steps'
 * @import {ActionDataModStep} from '../battle-steps'
 */

const seedrandom = require('seedrandom');
const BattleSteps = require('../battle-steps');
const { BattlePlayer, BattleMonster, BattleAgent } = require('../../datastore-objects/battle-agent');
const chatRPGUtility = require('../../utility');
const gameplayObjects = require('../../gameplay-objects');
const Ability = require('../../datastore-objects/ability');
const Item = require('../../datastore-objects/item');
const { Effect } = require('../effect');
const { BattleContext } = require('../battle-context');
const { StrikeAbilityBattleMove } = require('../strike-ability-battle-move');
const { StrikeBattleMove } = require('../strike-battle-move');
const { Battle } = require('../../datastore-objects/battle');
const { findBattleStep, calcHitDamage } = require('../utility');
const { ActionGeneratorCreator, GeneratorCreatorType } = require('../battle-system-types');
const { BattleMove } = require('../battle-move');

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

    const healStep = BattleSteps.heal(player1, player1.getData().maxHealth);

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
    const battle = new Battle({
        player: new BattlePlayer().getData(),
        monster: new BattleMonster().getData(),
        gameId: '',
        strikeAnim: undefined,
        environment: undefined,
        round: 0,
        active: false,
    }).getData();
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

test('Revive step', () => {
    const player1 = new BattlePlayer();

    player1.getData().health = 0;
    const reviveStep = BattleSteps.revive(player1, 0.5);

    expect(reviveStep).toBeDefined();
    expect(reviveStep.type).toMatch('revive');
    expect(reviveStep.healAmount).toBe(Math.floor(player1.getData().maxHealth*0.5));
    expect(player1.getData().health).toBe(reviveStep.healAmount);
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

test('Max Ap Change step', () => {
    const player1 = new BattlePlayer();

    let apChangeStep = BattleSteps.maxApChange(player1, 3);

    expect(apChangeStep.netChange).toBe(3);
    expect(player1.getData().maxAp).toBe(6);
    expect(apChangeStep.type).toMatch('maxApChange');

    apChangeStep = BattleSteps.maxApChange(player1, -2);

    expect(apChangeStep).toBeDefined();
    expect(apChangeStep.netChange).toBe(-2);
    expect(player1.getData().maxAp).toBe(4);

    apChangeStep = BattleSteps.maxApChange(player1, -2);

    expect(apChangeStep.netChange).toBe(-2);
    expect(player1.getData().maxAp).toBe(2);

    apChangeStep = BattleSteps.maxApChange(player1, -4);

    expect(apChangeStep.netChange).toBe(-2);
    expect(player1.getData().maxAp).toBe(0);

    

});

test('Generate Hit Steps: damage', ()=>{
    const battleContext = new BattleContext();
    const player1 = battleContext.player;
    player1.setStatsAtLevel(10);
    const player2 = battleContext.monster;
    player2.setStatsAtLevel(10);

    const baseDamage = 50;
    const battleSteps = BattleSteps.genHitSteps(player1, player2, baseDamage, 'physical', 'rando style', [], battleContext);
    const damageStep = /**@type {DamageStep}*/(findBattleStep('damage', battleSteps));

    const damage = calcHitDamage(player1.getData().level, baseDamage, player1.getData().strength, player2.getData().defense);

    expect(battleSteps).toBeDefined();
    expect(battleSteps[0].type).toMatch('damage');
    expect(damageStep.damage).toBe(damage);
    expect(player2.getData().maxHealth - player2.getData().health).toBeCloseTo(damageStep.damage);
});

test('Generate Hit Steps: weapon synergy', () => {
    const battleContext = new BattleContext();
    battleContext.player.setStatsAtLevel(10);
    battleContext.monster.setStatsAtLevel(10);
    const player1 = battleContext.player;
    const player2 = battleContext.player;

    const baseDamage = 50;
    const battleSteps = BattleSteps.genHitSteps(player1, player2, baseDamage, 'physical', 'melee', [], battleContext);
    const damageStep = /**@type {DamageStep}*/(findBattleStep('damage', battleSteps));

    const damage = calcHitDamage(player1.getData().level, baseDamage, player1.getData().strength, player2.getData().defense);

    expect(battleSteps).toBeDefined();
    expect(battleSteps[0].type).toMatch('damage');
    expect(player2.getData().maxHealth - player2.getData().health).toBeCloseTo(damageStep.damage);
    expect(damageStep.damage).toBeGreaterThan(damage);
});

describe.each([
    ['Ablazed', 'fire', gameplayObjects.statusEffects.ablazed, '5'],
    ['Surged', 'lightning', gameplayObjects.statusEffects.surged, '5'],
    ['Drenched', 'water', gameplayObjects.statusEffects.drenched, '5'],
])('Generate Hit Steps: %s', (statusName, element, statusEffect, randomSeed) => {
    test('Basic test', () => {
        chatRPGUtility.random = seedrandom(randomSeed);
        const battleContext = new BattleContext();

        const baseDamage = 50;
        const battleSteps = BattleSteps.genHitSteps(battleContext.player, battleContext.monster, baseDamage, 'physical', 'melee', [element], battleContext);

        const step = /**@type {AddEffectStep}*/(findBattleStep('addEffect', battleSteps));

        expect(step.type).toMatch('addEffect');
        expect(step.successful).toBeTruthy();
        expect(step.effect.className).toMatch(`${statusName}Effect`);
        expect(step.effect.targetId).toMatch(battleContext.monster.getData().id);
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
        const battleContext = new BattleContext();

            const battleSteps = BattleSteps.genHitSteps(battleContext.player, battleContext.monster, baseDamage, 'physical', 'melee', [element], battleContext);
            const step = /**@type {AddEffectStep}*/(findBattleStep('addEffect', battleSteps));

            if (step)
            {
                return true;
            }
    
            return false;
        }, 1000);
    
    
        expect(inflictRate).toBeGreaterThanOrEqual(expectedRate - marginOfError);
        expect(inflictRate).toBeLessThanOrEqual(expectedRate + marginOfError);
    });
});

test('Generate Hit Steps: override damage modifier', () => {
    const player1 = new BattlePlayer();
    player1.setStatsAtLevel(10);
    player1.getData().strength = 0;
    const player2 = new BattlePlayer();
    player2.setStatsAtLevel(10);

    const baseDamage = 50;
    const battleSteps = BattleSteps.genHitSteps(player1, player2, baseDamage, 'physical', 'sword', null, new BattleContext(), {overrideDamageModifier: 'defense'});

    expect(battleSteps).toBeDefined();
    expect(battleSteps[0].type).toMatch('damage');
    expect(/**@type {DamageStep}*/(battleSteps[0]).damage).toBeGreaterThan(2);
});

test('Generate Hit Steps: defense pen', () => {
    const player1 = new BattlePlayer();
    player1.setStatsAtLevel(10);
    const player2 = new BattlePlayer();
    player2.setStatsAtLevel(10);
    player2.getData().defense = 1000000000;

    const baseDamage = 50;
    const battleSteps = BattleSteps.genHitSteps(player1, player2, baseDamage, 'physical', 'sword', null, new BattleContext(), {defensePen: 0.999999999});

    expect(battleSteps).toBeDefined();
    expect(battleSteps[0].type).toMatch('damage');
    expect(/**@type {DamageStep}*/(battleSteps[0]).damage).toBeGreaterThan(2);
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
        expect(player1.getData().protection[protectionType]).toBe(player1.getData().maxHealth/2);
    });
});

test('Adding and removing abilities', () => {
    const player1 = new BattlePlayer({id: 'player'});
    const ability = new Ability({name: 'test'});

    const addAbilityStep = BattleSteps.addAbility(player1, ability.getData());

    expect(addAbilityStep.type).toBe('addAbility');
    expect(addAbilityStep.ability).toStrictEqual(ability.getData());
    expect(addAbilityStep.targetId).toBe(player1.getData().id);

    const abilityData = ability.getData();
    
    if (!abilityData.name) {fail();}
    const removeAblityStep = BattleSteps.removeAbility(player1, abilityData.name);

    expect(removeAblityStep.type).toBe('removeAbility');
    expect(removeAblityStep.ability).toStrictEqual(ability.getData());
    expect(removeAblityStep.targetId).toBe(player1.getData().id);
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

test("Add Effect", () => {
    const battleContext = new BattleContext();
    class TestEffect extends Effect {
        /**
         * 
         * @param {BattleAgent} battleAgent 
         * @param {Object} inputData 
         */
        constructor(battleAgent, inputData) {
            super(battleAgent, inputData);
            this.name = "test1";
        }
    };
    const testEffect = new TestEffect(battleContext.player, {});
    let effectStep = BattleSteps.addEffect(battleContext, testEffect);

    expect(effectStep.successful).toBeTruthy();
    expect(effectStep.type).toMatch('addEffect');
    expect(effectStep.effect.className).toMatch(testEffect.className);
    expect(effectStep.effect.persistentId).toBeUndefined();
    expect(effectStep.effect.inputData).toStrictEqual(testEffect.getInputData());
    expect(battleContext.isEffectActive(testEffect)).toBeTruthy();

    effectStep = BattleSteps.addEffect(battleContext, testEffect);

    expect(effectStep.successful).toBeFalsy();

    const testEffect2 = new TestEffect(battleContext.player, {});
    effectStep = BattleSteps.addEffect(battleContext, testEffect2);

    expect(effectStep.successful).toBeTruthy();
    expect(effectStep.type).toMatch('addEffect');
    expect(effectStep.effect.className).toMatch(testEffect.className);
    expect(effectStep.effect.persistentId).toBeUndefined();
    expect(effectStep.effect.inputData).toStrictEqual(testEffect2.getInputData());
    expect(battleContext.isEffectActive(testEffect2)).toBeTruthy();

});

test('Add Effect Unique', () => {
    const battleContext = new BattleContext();
    class TestEffect extends Effect {
        /**
         * 
         * @param {BattleAgent} battleAgent 
         * @param {Object} inputData 
         */
        constructor(battleAgent, inputData) {
            super(battleAgent, inputData);
            this.name = "test1";
            this.unique = true;
        }
    };

    const testEffect = new TestEffect(battleContext.player, {});
    const testEffect2 = new TestEffect(battleContext.player, {});

    BattleSteps.addEffect(battleContext, testEffect);
    let effectStep = BattleSteps.addEffect(battleContext, testEffect2);

    expect(effectStep.successful).toBeFalsy();
});

test('Add effect persistent', () => {
    const battleContext = new BattleContext();
    class TestEffect extends Effect {
        /**
         * 
         * @param {BattleAgent} battleAgent 
         * @param {Object} inputData 
         */
        constructor(battleAgent, inputData) {
            super(battleAgent, inputData);
            this.name = "test1";
            this.persistentId = 'testId';
        }
    };

    const testEffect = new TestEffect(battleContext.player, {});
    BattleSteps.addEffect(battleContext, testEffect);

    expect(battleContext.player.getData().effectsMap[testEffect.persistentId]).toBeDefined();

});

test('Remove Effect', () => {
    const battleContext = new BattleContext();
    class TestEffect extends Effect {
        /**
         * 
         * @param {BattleAgent} battleAgent 
         * @param {Object} inputData 
         */
        constructor(battleAgent, inputData) {
            super(battleAgent, inputData);
            this.name = "test1";
        }
    };

    const testEffect = new TestEffect(battleContext.player, {});
    BattleSteps.addEffect(battleContext, testEffect); 
    let effectStep = BattleSteps.removeEffect(battleContext, testEffect);
    
    expect(effectStep.successful).toBeTruthy();
    expect(effectStep.type).toMatch('removeEffect');
    expect(effectStep.effect.className).toMatch(testEffect.className);
    expect(effectStep.effect.persistentId).toBeUndefined();
    expect(effectStep.effect.inputData).toStrictEqual(testEffect.getInputData());
    expect(battleContext.isEffectActive(testEffect)).toBeFalsy();

    effectStep = BattleSteps.removeEffect(battleContext, testEffect);

    expect(effectStep.successful).toBeFalsy();
});

test('Remove Effect Persisent', () => {
    const battleContext = new BattleContext();
    class TestEffect extends Effect {
        /**
         * 
         * @param {BattleAgent} battleAgent 
         * @param {Object} inputData 
         */
        constructor(battleAgent, inputData) {
            super(battleAgent, inputData);
            this.name = "test1";
            this.persistentId = 'testId';
        }
    };

    const testEffect = new TestEffect(battleContext.player, {});
    BattleSteps.addEffect(battleContext, testEffect);
    BattleSteps.removeEffect(battleContext, testEffect);

    expect(battleContext.player.getData().effectsMap[testEffect.persistentId]).toBeUndefined();
});

test('Action Generator Data Mod', () => {
    const battleContext = new BattleContext();
    const strikeMove = new StrikeBattleMove(battleContext.player);
    const actionGenerator = strikeMove.onActivate(battleContext);

    /**@type {(data: StrikeBattleMoveData) => void} */
    const modFunction = (data) => {
            data.strikeData.apChange += 2;
    }

    const step = BattleSteps.actionGeneratorDataMod(actionGenerator, modFunction, 'player', 'buff', 'Buffing ap');

    expect(step.type).toMatch('actionGenMod');
    expect(step.action).toMatch('buff');
    expect(step.targetId).toMatch('player');
    expect(step.description).toMatch('Buffing ap');
    expect(actionGenerator.inputData.strikeData.apChange).toBe(3);
});

test('Action Data Mod', () => {
    const battleContext = new BattleContext();

    /**@type {Action} */
    const action = {
        playerAction: {
            targetPlayer: battleContext.player,
            baseDamage: 10
        }
    };

    /**@type {(data: Action) => void} */
    const modFunction = (data) => {
        if (data.playerAction && data.playerAction.baseDamage) {
            data.playerAction.baseDamage += 10;
        }
    }

    const step = /**@type {ActionDataModStep}*/(BattleSteps.actionMod(action, modFunction, 'player', 'buff', 'Buffing damage'));

    expect(step.type).toMatch('actionMod');
    expect(step.action).toMatch('buff');
    expect(step.targetId).toMatch('player');
    expect(step.description).toMatch('Buffing damage');
    expect(action.playerAction?.baseDamage).toBe(20);
});

test('Removing Action Generators', () => {
    const battleContext = new BattleContext();
    const strike = new StrikeBattleMove(battleContext.player);
    const strikeActionGen = strike.onActivate(battleContext);
    let step = BattleSteps.removeActionGenerator(battleContext, strikeActionGen, battleContext.player.getData().id, "counter");

    expect(step.type).toMatch('removeActionGenerator');
    expect(step.successful).toBeFalsy();
    expect(step.action).toMatch('counter');

    battleContext.addActionGenerator(strikeActionGen, new ActionGeneratorCreator());
    step = BattleSteps.removeActionGenerator(battleContext, strikeActionGen, battleContext.player.getData().id, "counter");

    expect(step.type).toMatch('removeActionGenerator');
    expect(step.successful).toBeTruthy();
    expect(step.targetId).toMatch('player');
    expect(step.action).toMatch('counter');

    const ag = battleContext.getTopActionGenerator();

    expect(ag).toBeUndefined();
});

test('Trigger Abilities', () => {
    const battleContext = new BattleContext();
    const abilityData = new Ability({name: 'Ability'}).getData();
    const triggerStep = BattleSteps.triggerAbility(battleContext, abilityData, battleContext.player);

    expect(triggerStep.type).toMatch('triggerAbility');
    expect(triggerStep.ability).toStrictEqual(abilityData);

    const actionGen = battleContext.getTopActionGenerator();

    if (!actionGen) {fail();}
    expect(actionGen.creator.creatorType).toBe(GeneratorCreatorType.Ability)

    const abilityMove = /**@type {BattleMove}*/(actionGen.creator);

    expect(abilityMove.getInputData()).toStrictEqual(abilityData);
});
