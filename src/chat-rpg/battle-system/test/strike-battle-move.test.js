/**
 * @import {Action} from "../action"
 */

const { BattleContext } = require("../battle-context");
const { StrikeBattleMove } = require("../strike-battle-move");

test("Basic strike action creator", () => {
    const battleContext = new BattleContext();

    const strikeMove = new StrikeBattleMove(battleContext.player);
    const actionGenerator = strikeMove.onActivate(battleContext);

    let actionObject = actionGenerator.next();

    expect(actionObject).toBeDefined();
    expect(actionObject.value).toBe(true);

    let action = /** @type {Action} */ (actionGenerator.next().value);

    expect(action.infoAction).toBeDefined();
    expect(action.infoAction?.action).toMatch('strike');
    expect(action.infoAction?.targetAgentId).toMatch('monster');
    expect(action.infoAction?.srcAgentId).toMatch('player');
    expect(action.playerAction).toBeDefined();
    expect(action.playerAction?.targetPlayer).toBe(battleContext.player);
    expect(action.playerAction?.apChange).toBe(1);
    expect(action.playerAction?.strikeLevelChange).toBe(1);

    action = /** @type {Action} */ (actionGenerator.next().value);

    expect(action.infoAction).toBeDefined();
    expect(action.infoAction?.animation).toBeDefined();
    expect(action.infoAction?.srcAgentId).toMatch('player');
    expect(action.infoAction?.targetAgentId).toMatch('monster');
    expect(action.playerAction).toBeDefined();
    expect(action.playerAction?.srcPlayer).toBe(battleContext.player);
    expect(action.playerAction?.targetPlayer).toBe(battleContext.monster);
    expect(action.playerAction?.type).toBe(battleContext.player.getData().weapon.type);
    expect(action.playerAction?.style).toBe(battleContext.player.getData().weapon.style);
    expect(action.playerAction?.baseDamage).toBe(battleContext.player.getData().weapon.baseDamage);

    actionObject = actionGenerator.next();
    action = /** @type {Action} */ (actionObject.value);

    expect(action).toBeUndefined();
    expect(actionObject.done).toBeTruthy();
});