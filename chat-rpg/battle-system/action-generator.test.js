
const { BattlePlayer, BattleAgent } = require("../datastore-objects/battle-agent");
const { PlayerActionType, PlayerActionStyle } = require("./action");
const { ActionGenerator, ActionCreatorType } = require("./action-generator");

/**
 * @typedef {import("./action").Action} Action
 * @typedef {import("./action-generator").ActionGeneratorObject} ActionGeneratorObject
 */



test('Creating generators and using them', () => {
    const player1 = new BattleAgent();
    const player2 = new BattleAgent();
    /** @type {Action} */
    const action1 = {
        playerAction: {
            srcPlayer: player1,
            targetPlayer: player2,
            type: PlayerActionType.Magical,
            style: PlayerActionStyle.Sword,
            baseDamage: 1
        }
    };
    /** @type {Action} */
    const action2 = {
        playerAction: {
            srcPlayer: player1,
            targetPlayer: player2,
            type: PlayerActionType.Magical,
            style: PlayerActionStyle.Sword,
            baseDamage: 2
        }
    };

    const inputData = {
        input: "hello"
    }
    let testInputData;

    const actionCreator = {
        owner: new BattlePlayer(),
        creatorType: ActionCreatorType.None,
        getInputData() {
            return inputData;
        },

        /**
         * @returns {ActionGeneratorObject}
         */
        *generate() {
            testInputData = yield true;
            yield action1;
            yield action2;
        }
    };

    const actionGenerator = new ActionGenerator(actionCreator.generate());

    expect(actionGenerator.inputData).toBe(inputData);

    let action = actionGenerator.next();

    expect(action).toBeTruthy();
    expect(testInputData).not.toBeDefined();

    action = actionGenerator.next();
   
    expect(action).toBeDefined();
    expect(action.done).toBeFalsy();
    expect(action.value).toBe(action1);
    expect(testInputData).toBe(inputData);

    action = actionGenerator.next();

    expect(action).toBeDefined();
    expect(action.done).toBeFalsy();
    expect(action.value).toBe(action2);
    
    action = actionGenerator.next();

    expect(action).toBeDefined();
    expect(action.done).toBeTruthy();
    expect(action.value).toBeUndefined();
});