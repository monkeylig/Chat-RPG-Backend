/** @import {Action} from "../action" */

const Item = require("../../datastore-objects/item");
const { BattleContext } = require("../battle-context");
const { revive } = require("../battle-steps");
const { ItemBattleMove } = require("../item-battle-move");

test("Increase AP Item", () => {
    const battleContext = new BattleContext();
    const item = new Item({
        count: 1,
        apChange: 3,
        name: 'testItem',
        target: 'self'
    });
    battleContext.player.addItemToBag(item);

    const itemMove = new ItemBattleMove(battleContext.player, item);
    const actionGenerator = itemMove.onActivate(battleContext);
    const firstYield = /**@type {boolean}*/(actionGenerator.next().value);

    expect(firstYield).toBe(true);

    let actionObject = /**@type {Action}*/(actionGenerator.next().value);

    expect(actionObject.infoAction).toBeDefined();
    expect(actionObject.infoAction?.action).toMatch("item");
    expect(actionObject.infoAction?.srcAgentId).toMatch("player");
    expect(actionObject.infoAction?.targetAgentId).toMatch("player");

    actionObject = /**@type {Action}*/(actionGenerator.next().value);

    expect(actionObject.playerAction).toBeDefined();
    expect(actionObject.playerAction?.apChange).toBe(3);
    expect(actionObject.playerAction?.targetPlayer).toBe(battleContext.player);

    actionObject = /**@type {Action}*/(actionGenerator.next().value);

    expect(actionObject.playerAction).toBeDefined();
    expect(actionObject.playerAction?.consumeItem).toMatch('testItem');
    expect(actionObject.playerAction?.targetPlayer).toBe(battleContext.player);

    const lastYield = actionGenerator.next();

    expect(lastYield.done).toBeTruthy();
    expect(lastYield.value).toBeUndefined();
});
