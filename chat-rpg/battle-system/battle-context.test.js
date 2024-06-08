const { BattleAgent } = require("../datastore-objects/battle-agent");
const { PlayerActionType, PlayerActionStyle } = require("./action");
const { ActionGenerator, ActionCreatorType } = require("./action-generator");
const { BattleContext } = require("./battle-context");

/**
 * @typedef {import("./action").Action} Action
 */

test("Action generator stack", () => {
    const actionCreator = {
        owner: new BattleAgent(),
        creatorType: ActionCreatorType.None,
        getInputData() {
            return {};
        },
        *generate() {}
    };
    const actionGenerator1 = new ActionGenerator(actionCreator, actionCreator.generate());
    const actionGenerator2 = new ActionGenerator(actionCreator, actionCreator.generate());

    const battleContext = new BattleContext(/** @type {BattleData} */({}));

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
    /** @type {import("./action").Action} */
    const action1 = {
        playerAction: {
            srcPlayer: new BattleAgent(),
            targetPlayer: new BattleAgent(),
            type: PlayerActionType.Magical,
            style: PlayerActionStyle.Staff
        }
    };

    /** @type {import("./action").Action} */
    const action2 = {
        playerAction: {
            srcPlayer: new BattleAgent(),
            targetPlayer: new BattleAgent(),
            type: PlayerActionType.Magical,
            style: PlayerActionStyle.Staff
        }
    };

    const battleContext = new BattleContext(/** @type {BattleData} */({}));

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