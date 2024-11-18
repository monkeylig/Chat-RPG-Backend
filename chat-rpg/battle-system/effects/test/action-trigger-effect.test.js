/**
 * @import {ActiveAction} from "../../battle-system-types"
 * @import {Action} from "../../action"
 */

const { BattleContext } = require("../../battle-context");
const { info } = require("../../battle-steps");
const { StrikeBattleMove } = require("../../strike-battle-move");
const { ActionTriggerEffect } = require("../action-trigger-effect");

test('Trigger Ability', () => {
    const battleContext = new BattleContext();
    const triggerEffect = new ActionTriggerEffect(battleContext.player, {
        filter: {
            user: 'send',
            playerAction: {
                isAttack: true,
                elements: ['fire']
            }
        },
        ability: {
            target: 'opponent',
            fireResistAmp: -1
        },
        roundsLeft: 1
    });

    const strikeMove = new StrikeBattleMove(battleContext.player);
    /**@type {ActiveAction} */
    const strikeAction = {
        creator: strikeMove,
        generator: strikeMove.onActivate(battleContext),
        action: {
            playerAction: {
                targetPlayer: battleContext.monster,
                srcPlayer: battleContext.player,
                type: 'sword',
                baseDamage: 10,
                elements: ['fire']
            }
        }
    };
    let actionGen = triggerEffect.onActionEnd(battleContext, strikeAction, []);
    let firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);

    let action = /**@type {Action}*/(actionGen.next().value);

    if (!action.playerAction) {fail();}
    expect(action.playerAction.fireResistAmp).toBe(-1);
    expect(action.playerAction.targetPlayer).toBe(battleContext.monster);
    
    let lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();
});

test('Attack was dodged', () => {
    const battleContext = new BattleContext();
    const triggerEffect = new ActionTriggerEffect(battleContext.player, {
        filter: {
            user: 'send',
            playerAction: {
                isAttack: true,
                elements: ['fire']
            }
        },
        ability: {
            target: 'opponent',
            fireResistAmp: -1
        },
        roundsLeft: 1
    });

    const strikeMove = new StrikeBattleMove(battleContext.player);
    /**@type {ActiveAction} */
    const strikeAction = {
        creator: strikeMove,
        generator: strikeMove.onActivate(battleContext),
        action: {
            playerAction: {
                targetPlayer: battleContext.monster,
                srcPlayer: battleContext.player,
                type: 'sword',
                baseDamage: 10,
                elements: ['fire']
            }
        }
    };
    let actionGen = triggerEffect.onActionEnd(battleContext, strikeAction, [info('', 'dodge', '', '')]);
    let firstYield = actionGen.next();

    expect(firstYield.done).toBe(true);
});

test('Trigger not matched', () => {
    const battleContext = new BattleContext();
    const triggerEffect = new ActionTriggerEffect(battleContext.player, {
        filter: {
            user: 'send',
            playerAction: {
                isAttack: true,
                elements: ['fire']
            }
        },
        ability: {
            target: 'opponent',
            fireResistAmp: -1
        },
        roundsLeft: 1
    });

    const strikeMove = new StrikeBattleMove(battleContext.player);
    /**@type {ActiveAction} */
    const strikeAction = {
        creator: strikeMove,
        generator: strikeMove.onActivate(battleContext),
        action: {
            playerAction: {
                targetPlayer: battleContext.monster,
                srcPlayer: battleContext.player,
                type: 'sword',
                baseDamage: 10,
                elements: ['water']
            }
        }
    };
    let actionGen = triggerEffect.onActionEnd(battleContext, strikeAction, []);
    let firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);
    
    let lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();
});

test('Wrong user', () => {
    const battleContext = new BattleContext();
    const triggerEffect = new ActionTriggerEffect(battleContext.player, {
        filter: {
            user: 'receive',
            playerAction: {
                isAttack: true,
                elements: ['fire']
            }
        },
        ability: {
            target: 'opponent',
            fireResistAmp: -1
        },
        roundsLeft: 1
    });

    const strikeMove = new StrikeBattleMove(battleContext.player);
    /**@type {ActiveAction} */
    const strikeAction = {
        creator: strikeMove,
        generator: strikeMove.onActivate(battleContext),
        action: {
            playerAction: {
                targetPlayer: battleContext.monster,
                srcPlayer: battleContext.player,
                type: 'sword',
                baseDamage: 10,
                elements: ['fire']
            }
        }
    };
    let actionGen = triggerEffect.onActionEnd(battleContext, strikeAction, []);
    let firstYield = actionGen.next();

    expect(firstYield.value).toBe(true);
    
    let lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();
});
