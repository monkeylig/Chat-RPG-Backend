const { generateAbilityActions } = require("../ability-utility");
const Ability = require("../../datastore-objects/ability");
const { BattleContext } = require("../battle-context");
const ActionTypes = require("../action");

test('Generate root level hit action', () => {
    const battleContext = new BattleContext();
    battleContext.player.getData().id = "player";
    battleContext.monster.getData().id = "monster";
    const ability = new Ability({
        baseDamage: 10,
        target: 'opponent'
    });

    const actions = generateAbilityActions(battleContext.player, ability.getData(), battleContext);
    let action = /** @type {ActionTypes.Action} */(actions.next().value);

    expect(action.infoAction).toBeDefined();

    action = /** @type {ActionTypes.Action} */(actions.next().value);

    expect(action.playerAction).toBeDefined();
    expect(action.playerAction?.baseDamage).toBe(10);
    expect(action.playerAction?.targetPlayer).toBe(battleContext.monster);
    expect(action.playerAction?.srcPlayer).toBe(battleContext.player);

    const lastYield = actions.next();

    expect(lastYield.done).toBeTruthy();
    expect(lastYield.value).toBeUndefined();

});