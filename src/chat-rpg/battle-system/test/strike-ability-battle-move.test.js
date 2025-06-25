const Ability = require("../../datastore-objects/ability");
const { BattleContext } = require("../battle-context");
const { StrikeAbilityBattleMove } = require("../strike-ability-battle-move");
const ActionTypes = require("../action");

test("Damage strike ability", () => {
    const battleContext = new BattleContext();
    const ability = new Ability({
        target: 'opponent',
        baseDamage: 20,
        apCost: 1,
        animation: {}
    });
    battleContext.player.getData().weapon.strikeAbility = ability.getData();
    battleContext.player.getData().strikeLevel = 2;

    const strikeAbilityMove = new StrikeAbilityBattleMove(battleContext.player);
    const actionGenerator = strikeAbilityMove.onActivate(battleContext);
    const firstYield = /**@type {boolean}*/(actionGenerator.next().value);

    expect(firstYield).toBe(true);

    let actionObject = /**@type {ActionTypes.Action}*/(actionGenerator.next().value);

    if (!actionObject.playerAction) {
        fail();
    }

    expect(actionObject.playerAction.strikeLevelChange).toBe(-2);
    expect(actionObject.playerAction.targetPlayer).toBe(battleContext.player);
    expect(actionObject.playerAction.srcPlayer).toBe(battleContext.player);

    actionObject = /**@type {ActionTypes.Action}*/(actionGenerator.next().value);

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
    expect(actionObject.playerAction).toBeDefined();
    expect(actionObject.playerAction?.baseDamage).toBe(20);
    expect(actionObject.playerAction?.targetPlayer).toBe(battleContext.monster);

    const lastYield = actionGenerator.next();

    expect(lastYield.done).toBe(true);
});

test("Damage strike ability: With AP Cost", () => {
    const battleContext = new BattleContext();
    const ability = new Ability({
        target: 'opponent',
        baseDamage: 20,
        animation: {}
    });
    battleContext.player.getData().weapon.strikeAbility = ability.getData();

    const strikeAbilityMove = new StrikeAbilityBattleMove(battleContext.player);
    const actionGenerator = strikeAbilityMove.onActivate(battleContext);
    const firstYield = /**@type {boolean}*/(actionGenerator.next().value);

    expect(firstYield).toBe(true);

    let actionObject = /**@type {ActionTypes.Action}*/(actionGenerator.next().value);

    if (!actionObject.playerAction) {
        fail();
    }

    expect(actionObject.playerAction).toBeDefined();
    expect(actionObject.playerAction.apChange).toBe(-2);
    expect(actionObject.playerAction.targetPlayer).toBe(battleContext.player);

    actionObject = /**@type {ActionTypes.Action}*/(actionGenerator.next().value);

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
    expect(actionObject.playerAction).toBeDefined();
    expect(actionObject.playerAction?.baseDamage).toBe(20);
    expect(actionObject.playerAction?.targetPlayer).toBe(battleContext.monster);

    const lastYield = actionGenerator.next();

    expect(lastYield.done).toBe(true);
});

test("Damage strike ability: With cheap AP Cost", () => {
    const battleContext = new BattleContext();
    const ability = new Ability({
        target: 'opponent',
        baseDamage: 20,
        animation: {}
    });
    battleContext.player.getData().weapon.strikeAbility = ability.getData();
    battleContext.player.getData().strikeLevel = 1;

    const strikeAbilityMove = new StrikeAbilityBattleMove(battleContext.player);
    const actionGenerator = strikeAbilityMove.onActivate(battleContext);
    const firstYield = /**@type {boolean}*/(actionGenerator.next().value);

    expect(firstYield).toBe(true);

    let actionObject = /**@type {ActionTypes.Action}*/(actionGenerator.next().value);

    if (!actionObject.playerAction) {
        fail();
    }

    expect(actionObject.playerAction).toBeDefined();
    expect(actionObject.playerAction.apChange).toBe(-1);
    expect(actionObject.playerAction.targetPlayer).toBe(battleContext.player);

    actionObject = /**@type {ActionTypes.Action}*/(actionGenerator.next().value);

    expect(actionObject.playerAction.strikeLevelChange).toBe(-1);
    expect(actionObject.playerAction.targetPlayer).toBe(battleContext.player);
    expect(actionObject.playerAction.srcPlayer).toBe(battleContext.player);

    actionObject = /**@type {ActionTypes.Action}*/(actionGenerator.next().value);

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
    expect(actionObject.playerAction).toBeDefined();
    expect(actionObject.playerAction?.baseDamage).toBe(20);
    expect(actionObject.playerAction?.targetPlayer).toBe(battleContext.monster);

    const lastYield = actionGenerator.next();

    expect(lastYield.done).toBe(true);
});
