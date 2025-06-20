/**
 * @import {Action} from "../../action"
 */

const Ability = require("../../../datastore-objects/ability");
const { BattleContext } = require("../../battle-context");
const { generateActions } = require("../protection-attack");
const { PlayerActionType } = require('../../action');
const utilities = require("../../ability-utility");

describe.each([
    [PlayerActionType.Physical],
    [PlayerActionType.Magical]
])('%s Protection Attack', (type) => {
    test('No Protection', () => {
        const battleContext = new BattleContext();
        const ability = new Ability({
            baseDamage: 50,
            target: 'opponent'
        });


        const actions = generateActions(battleContext.player, ability.getData(), {protectionType: type}, battleContext, utilities);

        const action = /**@type {Action}*/(actions.next().value);
        if (!action.playerAction || !action.playerAction.baseDamage) {
            fail();
        }

        expect(action.playerAction.baseDamage).toBe(50);
        expect(action.playerAction.targetPlayer).toBe(battleContext.monster);
    });

    test('Protection Attack: Protection', () => {
        const battleContext = new BattleContext();
        battleContext.player.getData().maxHealth = 10;
        battleContext.player.addProtection(type, 50)
        const ability = new Ability({
            baseDamage: 50,
            target: 'opponent'
        });
        
    
        const actions = generateActions(battleContext.player, ability.getData(), {protectionType: type}, battleContext, utilities);
    
        const action = /**@type {Action}*/(actions.next().value);
        if (!action.playerAction || !action.playerAction.baseDamage) {
            fail();
        }
    
        expect(action.playerAction.baseDamage).toBe(100);
        expect(action.playerAction.targetPlayer).toBe(battleContext.monster);
    });

    test('Protection Attack: Wrong Protection', () => {
        const battleContext = new BattleContext();
        battleContext.player.addProtection('wrong protection', 50)
        const ability = new Ability({
            baseDamage: 50,
            target: 'opponent'
        });
        
        const actions = generateActions(battleContext.player, ability.getData(), {protectionType: type}, battleContext, utilities);
    
        const action = /**@type {Action}*/(actions.next().value);
        if (!action.playerAction || !action.playerAction.baseDamage) {
            fail();
        }
    
        expect(action.playerAction.baseDamage).toBe(50);
        expect(action.playerAction.targetPlayer).toBe(battleContext.monster);
    });
});
