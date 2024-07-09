/** @import {ConsumeItemStep, InfoBattleStep, HealStep, ReviveStep, AddEffectStep} from "../battle-steps" */
/** @import {Action} from "../action" */

const { BattlePlayer, BattleAgent } = require("../../datastore-objects/battle-agent");
const Item = require("../../datastore-objects/item");
const { PlayerActionType, PlayerActionStyle } = require("../action");
const {ActionExecutor} = require("../action-executor");
const { BattleContext } = require("../battle-context");
const { Effect } = require("../effect");

test('Empty action', () => {
    let battleSteps = ActionExecutor.execute();

    expect(battleSteps).toBeDefined();
    expect(battleSteps instanceof Array).toBeTruthy();
    expect(battleSteps.length).toBe(0);

    battleSteps = ActionExecutor.execute({});

    expect(battleSteps).toBeDefined();
    expect(battleSteps instanceof Array).toBeTruthy();
    expect(battleSteps.length).toBe(0);
});

test('Agent hit action', () => {
    /** @type {Action} */
    const hitAction = {
        playerAction: {
            srcPlayer: new BattlePlayer(),
            targetPlayer: new BattlePlayer(),
            type: PlayerActionType.Physical,
            style: PlayerActionStyle.Sword,
            baseDamage: 10
        }
    };

    let battleSteps = ActionExecutor.execute(hitAction);

    expect(battleSteps.length).toBeGreaterThan(0);
    expect(battleSteps[0].type).toMatch('damage');
});

test('Info action', () => {
    /** @type {Action} */
    const infoAction = {
        infoAction: {
            description: 'Hello World'
        }
    };

    let battleSteps = ActionExecutor.execute(infoAction);

    expect(battleSteps.length).toBe(1);
    expect(battleSteps[0].type).toMatch('info');
    expect(battleSteps[0].description).toMatch('Hello World');
    expect(/** @type {InfoBattleStep} */(battleSteps[0]).action).toMatch('generic');
});

test('Strike Level change', () => {
    const player = new BattleAgent({id: 'player'});
    /** @type {Action} */
    const strikeLevelAction = {
        playerAction: {
            targetPlayer: player,
            type: PlayerActionType.Physical,
            style: PlayerActionStyle.Staff,
            strikeLevelChange: 1
        }
    }

    let battleSteps = ActionExecutor.execute(strikeLevelAction);

    expect(battleSteps.length).toBe(1);

    const strikeLevelStep = /** @type {import("../battle-steps").SStrikeLevelChangeStep} */(battleSteps[0]);

    expect(strikeLevelStep.type).toMatch('strikeLevelChange');
    expect(strikeLevelStep.netChange).toBe(1);
    expect(strikeLevelStep.targetId).toBe('player');
});

test('AP change', () => {
    const player = new BattleAgent({id: 'player'});
    /** @type {Action} */
    const apChangeAction = {
        playerAction: {
            targetPlayer: player,
            type: PlayerActionType.Physical,
            style: PlayerActionStyle.Staff,
            apChange: -1
        }
    }

    let battleSteps = ActionExecutor.execute(apChangeAction);

    expect(battleSteps.length).toBe(1);

    const apStep = /** @type {import("../battle-steps").SApChangeBattleStep} */(battleSteps[0]);

    expect(apStep.type).toMatch('apChange');
    expect(apStep.netChange).toBe(-1);
    expect(apStep.targetId).toBe('player');
});

test("Consume Item", () => {
    const item = new Item({
        name: 'testItem',
        count: 2
    });

    const player = new BattlePlayer({id: "player"});

    /** @type {Action} */
    const action = {
        playerAction: {
            targetPlayer: player,
            type: '',
            style: '',
            consumeItem: 'testItem'
        }
    };

    let battleSteps = ActionExecutor.execute(action);

    expect(battleSteps.length).toBe(1);

    const consumeStep = /** @type {ConsumeItemStep} */ (battleSteps[0]);

    expect(consumeStep.type).toMatch("consumeItem");
    expect(consumeStep.targetId).toMatch("player");

});

test("Heal", () => {
    const player = new BattleAgent({id: 'player', health: 1});
    /** @type {Action} */
    const apChangeAction = {
        playerAction: {
            targetPlayer: player,
            type: PlayerActionType.Physical,
            style: PlayerActionStyle.Staff,
            heal: 5
        }
    }

    let battleSteps = ActionExecutor.execute(apChangeAction);

    const apStep = /** @type {HealStep} */(battleSteps[0]);

    expect(apStep.type).toMatch('heal');
    expect(apStep.healAmount).toBe(5);
    expect(apStep.targetId).toBe('player');
});

test("Revive", () => {
    const player = new BattleAgent({id: 'player', health: 0});
    /** @type {Action} */
    const apChangeAction = {
        playerAction: {
            targetPlayer: player,
            type: PlayerActionType.Physical,
            style: PlayerActionStyle.Staff,
            revive: 0.5
        }
    }

    let battleSteps = ActionExecutor.execute(apChangeAction);

    const reviveStep = /** @type {ReviveStep} */(battleSteps[0]);

    expect(reviveStep.type).toMatch('revive');
    expect(reviveStep.healAmount).toBe(Math.floor(player.getData().maxHealth * 0.5));
    expect(reviveStep.targetId).toBe('player');
});

test('Add Effect', () => {
    const battleContext = new BattleContext();
    const testEffect = new Effect(battleContext.player, {});

    /** @type {Action} */
    const effectAction = {
        battleContextAction: {
            addEffect: testEffect,
            battleContext: battleContext
        }
    };

    const battleSteps = ActionExecutor.execute(effectAction);
    const effectStep = /**@type {AddEffectStep} */(battleSteps[0]);

    expect(effectStep.type).toMatch('addEffect');
    expect(effectStep.successful).toBeTruthy();
    expect(effectStep.effect.name).toMatch(testEffect.name);
});

test('Remove Effect', () => {
    const battleContext = new BattleContext();
    const testEffect = new Effect(battleContext.player, {});
    battleContext.addEffect(testEffect);

    /** @type {Action} */
    const effectAction = {
        battleContextAction: {
            removeEffect: testEffect,
            battleContext: battleContext
        }
    };

    const battleSteps = ActionExecutor.execute(effectAction);
    const effectStep = /**@type {AddEffectStep} */(battleSteps[0]);

    expect(effectStep.type).toMatch('removeEffect');
    expect(effectStep.successful).toBeTruthy();
    expect(effectStep.effect.name).toMatch(testEffect.name);
});
