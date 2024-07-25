/**
 * @import {ActionGeneratorObject} from "../../action-generator"
 * @import {Action} from "../../action"
 */

const { ActionExecutor } = require("../../action-executor");
const { BattleContext } = require("../../battle-context");
const { BattleMove } = require("../../battle-move");
const { SurgedEffect } = require("../surged-effect");
const { PlayerActionStyle, PlayerActionType, ElementsEnum } = require("../../action");

test('Gaining Surged', () => {
    const battleContext = new BattleContext();
    const surgedEffect = new SurgedEffect(battleContext.player, {
        trueDamage: 30,
        roundsLeft: 2
    });

    class TestMove extends BattleMove {
        /**
         * @override
         * @param {BattleContext} battleContext 
         * @returns {ActionGeneratorObject}
         */
        *activate(battleContext) {
            yield {
                battleContextAction: {
                    addEffect: surgedEffect
                }
            };
        }
    }

    const testMove = new TestMove(battleContext.player);
    const testMoveGenerator = testMove.onActivate(battleContext);
    const addEffectAction = /**@type {Action}*/(testMoveGenerator.next().value);
    const steps = ActionExecutor.execute(addEffectAction, battleContext);
    const surgedGen = surgedEffect.actionEndEvent(battleContext, {
        action: addEffectAction, 
        generator: testMoveGenerator,
        creator: testMove}, steps);

    const firstYield = surgedGen.next();

    expect(firstYield.value).toBe(true);

    const action = /**@type {Action}*/(surgedGen.next().value);

    if(!action.infoAction) {fail();}
    expect(action.infoAction.action).toMatch('surged');

    const lastYield = surgedGen.next();

    expect(lastYield.done).toBeTruthy();
});

test('Triggering damage', () => {
    const battleContext = new BattleContext();
    const surgedEffect = new SurgedEffect(battleContext.player, {
        trueDamage: 30,
        roundsLeft: 2
    });

    class TestMove extends BattleMove {
        /**
         * @override
         * @param {BattleContext} battleContext 
         * @returns {ActionGeneratorObject}
         */
        *activate(battleContext) {
            yield {
                playerAction: {
                    targetPlayer: this.owner,
                    srcPlayer: this.owner,
                    style: PlayerActionStyle.Sword,
                    type: PlayerActionType.Magical,
                    baseDamage: 10,
                    elements: [ElementsEnum.Lightning]
                }
            };
        }
    }

    const testMove = new TestMove(battleContext.player);
    const testMoveGenerator = testMove.onActivate(battleContext);
    const addEffectAction = /**@type {Action}*/(testMoveGenerator.next().value);
    const steps = ActionExecutor.execute(addEffectAction, battleContext);
    const surgedGen = surgedEffect.onActionEnd(battleContext, {
        action: addEffectAction, 
        generator: testMoveGenerator,
        creator: testMove}, steps);

    const firstYield = surgedGen.next();

    expect(firstYield.value).toBe(true);

    let action = /**@type {Action}*/(surgedGen.next().value);

    if(!action.playerAction) {fail();}
    expect(action.playerAction.trueDamage).toBe(30);
    expect(action.playerAction.targetPlayer).toBe(battleContext.player);
    expect(action.playerAction.type).toMatch(PlayerActionType.Natural);

    action = /**@type {Action}*/(surgedGen.next().value);

    if(!action.infoAction) {fail();}
    expect(action.infoAction.action).toMatch('surgeDamage');

    const lastYield = surgedGen.next();

    expect(lastYield.done).toBeTruthy();
});

test('Not triggering damage', () => {
    const battleContext = new BattleContext();
    const surgedEffectEffect = new SurgedEffect(battleContext.player, {
        trueDamage: 0.3,
        roundsLeft: 2
    });

    // First round
    let actionGen = surgedEffectEffect.onBattleRoundEnd(battleContext);
    let firstYield = actionGen.next().value;

    expect(firstYield).toBe(true);

    let lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();

    // Last round

    actionGen = surgedEffectEffect.onBattleRoundEnd(battleContext);
    firstYield = actionGen.next().value;

    expect(firstYield).toBe(true);

    lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();

    // This round, Surged will be removed
    actionGen = surgedEffectEffect.onBattleRoundEnd(battleContext);
    firstYield = actionGen.next().value;

    expect(firstYield).toBe(true);

    let action = /**@type {Action}*/(actionGen.next().value);

    if(!action.battleContextAction) {fail();}
    expect(action.battleContextAction.removeEffect).toBe(surgedEffectEffect);

    lastYield = actionGen.next();

    expect(lastYield.done).toBeTruthy();
});
