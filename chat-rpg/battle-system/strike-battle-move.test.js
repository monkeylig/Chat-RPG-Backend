const { BattlePlayer } = require("../datastore-objects/battle-agent");
const { StrikeBattleMove } = require("./strike-battle-move");

/**
 * @typedef {import("./action").Action} Action
 */

test("Basic strike action creator", () => {
    const player1 = new BattlePlayer();
    const player2 = new BattlePlayer();

    const strikeMove = new StrikeBattleMove(player1, player2);
    const actionGenerator = strikeMove.activate({});

    let actionObject = actionGenerator.next();

    expect(actionObject).toBeDefined();
    expect(actionObject.value).toBe(true);

    actionObject = actionGenerator.next();

    let action = /** @type {Action} */ (actionObject.value);

    expect(action.playerAction).toBeDefined();
    expect(action.playerAction.srcPlayer).toBe(player1);
    expect(action.playerAction.targetPlayer).toBe(player2);
    expect(action.playerAction.type).toBe(player1.getData().weapon.type);
    expect(action.playerAction.style).toBe(player1.getData().weapon.style);
    expect(action.playerAction.baseDamage).toBe(player1.getData().weapon.baseDamage);
});