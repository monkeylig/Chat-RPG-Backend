/** @import {ConsumeItemStep, SInfoBattleStep} from "../battle-steps" */
/** @import {Action} from "../action" */

const { BattlePlayer, BattleAgent } = require("../../datastore-objects/battle-agent");
const Item = require("../../datastore-objects/item");
const { PlayerActionType, PlayerActionStyle } = require("../action");
const {ActionExecutor} = require("../action-executor");

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
    expect(/** @type {SInfoBattleStep} */(battleSteps[0]).action).toMatch('generic');
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