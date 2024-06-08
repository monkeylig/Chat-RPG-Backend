const { BattlePlayer } = require("../datastore-objects/battle-agent");
const { PlayerActionType, PlayerActionStyle } = require("./action");
const ActionExecutor = require("./action-executor");

/** @typedef {import("./action").Action} Action */

test('empty action', () => {
    let battleSteps = ActionExecutor.execute();

    expect(battleSteps).toBeDefined();
    expect(battleSteps instanceof Array).toBeTruthy();
    expect(battleSteps.length).toBe(0);

    battleSteps = ActionExecutor.execute({});

    expect(battleSteps).toBeDefined();
    expect(battleSteps instanceof Array).toBeTruthy();
    expect(battleSteps.length).toBe(0);
});

test('agent hit action', () => {
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