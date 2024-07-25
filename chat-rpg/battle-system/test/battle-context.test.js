/**
 * @import {ActiveActionGenerator, ActiveAction} from "../battle-system-types"
 * @import {ActionGeneratorObject} from "../action-generator"
 * @import {BattleData} from "../battle-system"
 */

const { ActionGeneratorCreator } = require("../battle-system-types");
const { ActionGenerator } = require("../action-generator");
const { BattleContext } = require("../battle-context");
const { Effect } = require("../effect");
const { BattlePlayer, BattleAgent, BattleMonster } = require("../../datastore-objects/battle-agent");
const { StrikeBattleMove } = require("../strike-battle-move");
const { effect, ReviveEffect } = require("../effects/revive-effect");
const { Battle } = require("../../datastore-objects/battle");
const monsterAi = require("../../monster-ai/monster-ai");

class ActionCreator extends ActionGeneratorCreator {
    constructor() {
        super();
    }
    /**
     * @returns {ActionGeneratorObject}
     */
    *generate() {}

    /**
     * @returns {ActionGeneratorObject}
     */
    *generateRespondAll() {
        yield true;
    }
};

test("Action generator stack", () => {
    
    const actionCreator = new ActionCreator();
    
    /** @type {ActiveActionGenerator} */
    const actionGenerator1 = {
        generator: new ActionGenerator(actionCreator.generate()),
        creator: actionCreator
    };

    /** @type {ActiveActionGenerator} */
    const actionGenerator2 = {
        generator: new ActionGenerator(actionCreator.generate()),
        creator: actionCreator
    };

    const battleContext = new BattleContext();

    const actionStack = battleContext.getActionGeneratorStack();

    expect(actionStack).toBeDefined();
    expect(actionStack.length).toBe(0);

    battleContext.pushActionGenerator(actionGenerator1);
   
    expect(actionStack.length).toBe(1);
    expect(actionStack[0]).toBe(actionGenerator1);
    
    battleContext.pushActionGenerator(actionGenerator2);

    expect(actionStack.length).toBe(2);
    expect(actionStack[1]).toBe(actionGenerator2);

    let poppedActionGenerator = battleContext.popActionGenerator();

    expect(poppedActionGenerator).toBeDefined();
    expect(poppedActionGenerator).toBe(actionGenerator2);
    expect(actionStack.length).toBe(1);

    poppedActionGenerator = battleContext.popActionGenerator();

    expect(poppedActionGenerator).toBeDefined();
    expect(poppedActionGenerator).toBe(actionGenerator1);
    expect(actionStack.length).toBe(0);
});

test("Action stack", () => {
    const actionCreator = new ActionCreator();

    /** @type {ActiveAction} */
    const action1 = {
        action: {
            infoAction: {
                description: "hello"
            }
        },
        generator: new ActionGenerator(actionCreator.generate()),
        creator: actionCreator
    };

    /** @type {ActiveAction} */
    const action2 = {
        action: {
            infoAction: {
                description: "hello"
            }
        },
        generator: new ActionGenerator(actionCreator.generate()),
        creator: actionCreator
    };

    const battleContext = new BattleContext();

    const actionStack = battleContext.getActionStack();

    expect(actionStack).toBeDefined();
    expect(actionStack.length).toBe(0);

    battleContext.pushAction(action1);
   
    expect(actionStack.length).toBe(1);
    expect(actionStack[0]).toBe(action1);
    
    battleContext.pushAction(action2);

    expect(actionStack.length).toBe(2);
    expect(actionStack[1]).toBe(action2);

    let poppedActionGenerator = battleContext.popAction();

    expect(poppedActionGenerator).toBeDefined();
    expect(poppedActionGenerator).toBe(action2);
    expect(actionStack.length).toBe(1);

    poppedActionGenerator = battleContext.popAction();

    expect(poppedActionGenerator).toBeDefined();
    expect(poppedActionGenerator).toBe(action1);
    expect(actionStack.length).toBe(0);
});

test("Adding and Removing Effects", () => {
    const battleContext = new BattleContext();
    const effect1 = new Effect(new BattlePlayer());
    const effect2 = new Effect(new BattlePlayer());

    expect(battleContext.getActiveEffects().length).toBe(0);

    battleContext.addEffect(effect1);

    expect(battleContext.getActiveEffects().length).toBe(1);

    battleContext.addEffect(effect2);

    expect(battleContext.getActiveEffects().length).toBe(2);

    let removedEffect = battleContext.removeEffect(effect1);

    expect(removedEffect).toBe(effect1);
    expect(battleContext.getActiveEffects().length).toBe(1);

    removedEffect = battleContext.removeEffect(effect2);

    expect(removedEffect).toBe(effect2);
    expect(battleContext.getActiveEffects().length).toBe(0);

});

test("Pushing an ActionGenerator", () => {
    const battleContext = new BattleContext();
    const actionCreator = new ActionCreator();
    const actionGenerator1 = new ActionGenerator(actionCreator.generateRespondAll());
    battleContext.addActionGenerator(actionGenerator1, actionCreator);

    let topActionGenerator = battleContext.getTopActionGenerator();

    expect(topActionGenerator).toBeDefined();
    expect(topActionGenerator?.generator).toBe(actionGenerator1);
    expect(topActionGenerator?.creator).toBe(actionCreator);

    class TestEffect extends Effect {
        /**
         * @override
         * @param {BattleContext} battleContext 
         * @param {ActiveActionGenerator} activeActionGenerator 
         */
        *actionGeneratorBeginEvent(battleContext, activeActionGenerator) {
            this.lastBattleContext = battleContext;
            this.lastActionGenerator = activeActionGenerator;
        }
    }

    const testEffect = new TestEffect(new BattlePlayer());
    battleContext.addEffect(testEffect);
    const actionGenerator2 = new ActionGenerator(actionCreator.generateRespondAll());
    battleContext.addActionGenerator(actionGenerator2, actionCreator);

    expect(testEffect.lastActionGenerator?.generator).toBe(actionGenerator2);
    expect(testEffect.lastActionGenerator?.creator).toBe(actionCreator);
    expect(testEffect.lastBattleContext).toBe(battleContext);
});

test("Pushing an Action", () => {
    const battleContext = new BattleContext();
    const actionCreator = new ActionCreator();
    const actionGenerator = new ActionGenerator(actionCreator.generateRespondAll());
    const action = {};

    battleContext.addAction(action, actionGenerator, actionCreator);

    expect(battleContext.getTopAction()?.action).toBe(action);
});

test("Activating battle moves", () => {
    const battleContext = new BattleContext();

    const strikeMove = new StrikeBattleMove(battleContext.player);
    battleContext.activateBattleMove(strikeMove);

    expect(battleContext.getTopActionGenerator()?.creator).toBe(strikeMove)
});

test("Resolving battles", () => {
    const battleContext = new BattleContext();

    battleContext.activateBattleMove(new StrikeBattleMove(battleContext.player));
    battleContext.activateBattleMove(new StrikeBattleMove(battleContext.monster));
    const battleSteps = battleContext.resolve();

    expect(battleSteps.length).toBeGreaterThan(0);
    expect(battleContext.player.getData().health).toBeLessThan(battleContext.player.getData().maxHealth);
    expect(battleContext.monster.getData().health).toBeLessThan(battleContext.monster.getData().maxHealth);
    
});

test('Restoring persistent Effects', () => {
    const player = new BattlePlayer({
        id: 'player'
    });
    const reviveEfect = new ReviveEffect(player);
    player.setEffect(reviveEfect.getData());

    const battleData = new Battle({
        player: player.getData(),
        monster: new BattleMonster().getData()
    }).getData();
    const battleContext = new BattleContext(battleData, true);

    expect(battleContext.getEffectCount(reviveEfect.name)).toBe(1);
    expect(battleContext.getActiveEffects()[0].targetPlayer).toBe(battleContext.player);
    expect(battleContext.getActiveEffects()[0].getInputData()).toStrictEqual(reviveEfect.getInputData());
});

test('Restoring effects mid battle', () => {
    const player = new BattlePlayer({
        id: 'player'
    });
    const reviveEfect = new ReviveEffect(player);

    const battleData = new Battle({
        player: player.getData(),
        monster: new BattleMonster().getData(),
        effects: [
            reviveEfect.getData()
        ]
    }).getData();
    const battleContext = new BattleContext(battleData);

    expect(battleContext.getEffectCount(reviveEfect.name)).toBe(1);
    expect(battleContext.getActiveEffects()[0].targetPlayer).toBe(battleContext.player);
    expect(battleContext.getActiveEffects()[0].persistentId).toBe(reviveEfect.persistentId);
    expect(battleContext.getActiveEffects()[0].getInputData()).toStrictEqual(reviveEfect.getInputData());

});

test('Serializing effects after iteration', () => {
    const player = new BattlePlayer({
        id: 'player'
    });
    const reviveEfect = new ReviveEffect(player);
    player.setEffect(reviveEfect.getData());

    const battleData = new Battle({
        player: player.getData(),
        monster: new BattleMonster().getData()
    }).getData();
    const battleContext = new BattleContext(battleData, true);

    const strike = new StrikeBattleMove(battleContext.player);
    battleContext.activateBattleMove(strike);
    battleContext.resolve();
    
    expect(battleContext.battle.effects.length).toBe(1);
    expect(battleContext.battle.effects[0].className).toBe(reviveEfect.className);
    expect(battleContext.battle.effects[0].targetId).toBe('player');
    expect(battleContext.battle.effects[0].inputData).toStrictEqual(reviveEfect.getInputData());
});

test('Begin and End Round', () => {
    class EffectTester extends Effect {

        /**
         * @override
         * @param {BattleContext} battleContext 
         * @returns {ActionGeneratorObject}
         */
        *battleRoundBeginEvent(battleContext) {
            yield true;
            yield {
                infoAction: {
                    description: "Round Begin",
                    action: "Begin"
                }
            };
        }

        /**
         * @override
         * @param {BattleContext} battleContext 
         * @returns {ActionGeneratorObject}
         */
        *battleRoundEndEvent(battleContext) {
            yield true;
            yield {
                infoAction: {
                    description: "Round End",
                    action: "End"
                }
            };
        }
    }

    const battleContext = new BattleContext();
    const effectTester = new EffectTester(battleContext.player, {});
    battleContext.addEffect(effectTester);

    let steps = battleContext.beginRound();

    expect(steps[0].type).toMatch('info');
    expect(steps[0].description).toMatch('Round Begin');

    steps = battleContext.endRound();

    expect(steps[0].type).toMatch('info');
    expect(steps[0].description).toMatch('Round End');
});