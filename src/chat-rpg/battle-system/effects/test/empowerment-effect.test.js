/**
 * @import {ActiveAction, ActiveActionGenerator} from "../../battle-system-types"
 * @import {Action} from "../../action"
 */

const Item = require("../../../datastore-objects/item");
const { BattleContext } = require("../../battle-context");
const { BattleMove } = require("../../battle-move");
const BattleSteps = require("../../battle-steps");
const { ItemBattleMove } = require("../../item-battle-move");
const { StrikeBattleMove } = require("../../strike-battle-move");
const { createEffect } = require("../effects");
const { EmpowermentEffect } = require("../empowerment-effect");

describe.each([
    ['physical'],
    ['magical']
])('%s empowerment effect test', (type) => {
    test('Empowerment', () => {
        const battleContext = new BattleContext();
        const empowermentEffect = new EmpowermentEffect(battleContext.player, {damageIncrease: 10, type});
        const strikeMove = new StrikeBattleMove(battleContext.player);
        /**@type {ActiveAction} */
        const strikeAction = {
            creator: strikeMove,
            generator: strikeMove.onActivate(battleContext),
            action: {
                playerAction: {
                    targetPlayer: battleContext.monster,
                    srcPlayer: battleContext.player,
                    type: type,
                    baseDamage: 10
                }
            }
        };

        let actionGen = empowermentEffect.onActionBegin(battleContext, strikeAction);
        let firstYield = actionGen.next();

        expect(firstYield.value).toBe(true);
        
        let action = /**@type {Action}*/(actionGen.next().value);

        if (!action.actionModAction) {fail();}
        expect(action.actionModAction.targetAction).toBe(strikeAction.action);
        expect(action.actionModAction.action).toMatch('buff');
        expect(action.actionModAction.targetId).toMatch('player');

        action.actionModAction.modFunction(strikeAction.action);

        expect(strikeAction.action.playerAction?.baseDamage).toBe(20);

        action = /**@type {Action}*/(actionGen.next().value);

        if (!action.battleContextAction) {fail();}
        expect(action.battleContextAction.removeEffect).toBe(empowermentEffect);

        let lastYield = actionGen.next();

        expect(lastYield.done).toBeTruthy();
    });
    
    test('Empowerment: Wrong player', () => {
        const battleContext = new BattleContext();
        battleContext.player.getData().weapon.baseDamage = 10;
        battleContext.player.getData().weapon.type = type;
        const empowermentEffect = new EmpowermentEffect(battleContext.player, {damageIncrease: 10, type});
        const strikeMove = new StrikeBattleMove(battleContext.monster);
        /**@type {ActiveActionGenerator} */
        const activeAction = {
            creator: strikeMove,
            generator: strikeMove.onActivate(battleContext)
        };
        const actionGen = empowermentEffect.onActionGeneratorBegin(battleContext, activeAction);

        const firstYield = actionGen.next();

        expect(firstYield.done).toBeTruthy();
    });

    test('Empowerment: Not a battle move', () => {
        const battleContext = new BattleContext();
        battleContext.player.getData().weapon.baseDamage = 10;
        battleContext.player.getData().weapon.type = type;
        const empowermentEffect = new EmpowermentEffect(battleContext.player, {damageIncrease: 10, type});
        const itemMove = new ItemBattleMove(battleContext.player, new Item());
        /**@type {ActiveActionGenerator} */
        const activeAction = {
            creator: itemMove,
            generator: itemMove.onActivate(battleContext)
        };
        const actionGen = empowermentEffect.onActionGeneratorBegin(battleContext, activeAction);

        const firstYield = actionGen.next();

        expect(firstYield.done).toBeTruthy();
    });

    test('Empowerment: Wrong type', () => {
        const battleContext = new BattleContext();
        const empowermentEffect = new EmpowermentEffect(battleContext.player, {damageIncrease: 10, type});
        const strikeMove = new StrikeBattleMove(battleContext.player);
        /**@type {ActiveAction} */
        const activeAction = {
            creator: strikeMove,
            generator: strikeMove.onActivate(battleContext),
            action: {
                playerAction: {
                    targetPlayer: battleContext.monster,
                    srcPlayer: battleContext.player,
                    type: 'wrong type',
                    baseDamage: 10
                }
            }
        };
        const actionGen = empowermentEffect.onActionBegin(battleContext, activeAction);

        const firstYield = actionGen.next();

        expect(firstYield.value).toBe(true);
        
        const lastYield = actionGen.next();

        expect(lastYield.done).toBeTruthy();
    });

    test('Empowerment: Resolve', () => {
        const battleContext = new BattleContext();
        battleContext.player.getData().weapon.baseDamage = 10;
        battleContext.player.getData().weapon.type = type;
        const empowermentEffect = new EmpowermentEffect(battleContext.player, {damageIncrease: 10, type});
        battleContext.addEffect(empowermentEffect);

        battleContext.activateBattleMove(new StrikeBattleMove(battleContext.player));
        const steps = battleContext.resolve();

        let buffFound = false;
        for(const step of steps) {
            if (step.type === 'actionMod') {
                buffFound = true;
            }
        }
        expect(buffFound).toBeTruthy();
    });

    test('Gaining the Effect', () => {
        const battleContext = new BattleContext();
        battleContext.player.getData().weapon.baseDamage = 10;
        battleContext.player.getData().weapon.type = type;

        const testbattleMove = new BattleMove(battleContext.player);
        const actionGen = testbattleMove.onActivate(battleContext);
        const action = /**@type {Action}*/(actionGen.next().value);
        const empowermentEffect = createEffect('EmpowermentEffect', {damageIncrease: 10, type}, battleContext.player);

        if (!empowermentEffect) {fail();}

        const steps = [BattleSteps.addEffect(battleContext, empowermentEffect)];

        /**@type {ActiveAction} */
        const actionAction = {
            generator: actionGen,
            creator: testbattleMove,
            action: action
        };

        const onAddGen = empowermentEffect.onActionEnd(battleContext, actionAction, steps);
        const firstYield = onAddGen.next();

        expect(firstYield.value).toBe(true);

        const infoAction = /**@type {Action}*/(onAddGen.next().value);

        if (!infoAction.infoAction) {fail();}
        expect(infoAction.infoAction.action).toMatch('empowerment');

        const lastYield = onAddGen.next();

        expect(lastYield.done).toBeTruthy();
    });
});