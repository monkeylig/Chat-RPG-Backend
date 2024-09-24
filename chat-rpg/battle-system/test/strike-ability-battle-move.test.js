const Ability = require("../../datastore-objects/ability");
const { BattleContext } = require("../battle-context");
const { StrikeAbilityBattleMove } = require("../strike-ability-battle-move");
const ActionTypes = require("../action");
const { AbilityBattleMove } = require("../ability-battle-move");

test("Damage strike ability", () => {
    const battleContext = new BattleContext();
    const ability = new Ability({
        target: 'opponent',
        baseDamage: 20,
        apCost: 1,
        animation: {}
    });
    battleContext.player.getData().weapon.strikeAbility = ability.getData();

    const strikeAbilityMove = new StrikeAbilityBattleMove(battleContext.player);
    const actionGenerator = strikeAbilityMove.onActivate(battleContext);
    const firstYield = /**@type {boolean}*/(actionGenerator.next().value);

    expect(firstYield).toBe(true);

    let actionObject = /**@type {ActionTypes.Action}*/(actionGenerator.next().value);

    expect(actionObject.infoAction).toBeDefined();
    expect(actionObject.infoAction?.action).toMatch("strikeAbility");
    expect(actionObject.infoAction?.srcAgentId).toMatch("player");
    expect(actionObject.infoAction?.targetAgentId).toMatch("monster");

    actionObject = /**@type {ActionTypes.Action}*/(actionGenerator.next().value);

    expect(actionObject.infoAction).toBeDefined();
    expect(actionObject.infoAction?.action).toMatch("animation");
    expect(actionObject.infoAction?.animation).toBeDefined();
    expect(actionObject.infoAction?.srcAgentId).toMatch("player");
    expect(actionObject.infoAction?.targetAgentId).toMatch("monster");

    actionObject = /**@type {ActionTypes.Action}*/(actionGenerator.next().value);

    expect(actionObject.playerAction).toBeDefined();
    expect(actionObject.playerAction?.baseDamage).toBe(20);
    expect(actionObject.playerAction?.targetPlayer).toBe(battleContext.monster);

    actionObject = /**@type {ActionTypes.Action}*/(actionGenerator.next().value);

    expect(actionObject.playerAction).toBeDefined();
    expect(actionObject.playerAction?.strikeLevelChange).toBe(-battleContext.player.getData().strikeLevel);
    expect(actionObject.playerAction?.targetPlayer).toBe(battleContext.player);
});