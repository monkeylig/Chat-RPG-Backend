/** 
 * @import {ConsumeItemStep, InfoBattleStep, HealStep, ReviveStep, AddEffectStep, StatAmpStep, ActionGeneratorDataModStep, ActionDataModStep, DamageStep} from "../battle-steps"
 * @import {Action} from "../action"
 * @import {StrikeBattleMoveData} from "../strike-battle-move"
 */

const seedrandom = require("seedrandom");
const { BattlePlayer, BattleAgent } = require("../../datastore-objects/battle-agent");
const Item = require("../../datastore-objects/item");
const chatRPGUtility = require("../../utility");
const { PlayerActionType, PlayerActionStyle } = require("../action");
const {ActionExecutor} = require("../action-executor");
const { BattleContext } = require("../battle-context");
const { Effect } = require("../effect");
const { StrikeBattleMove } = require("../strike-battle-move");
const { findBattleStep } = require("../utility");
const Ability = require("../../datastore-objects/ability");

test('Empty action', () => {
    const battleContext = new BattleContext();
    let battleSteps = ActionExecutor.execute({}, battleContext);

    expect(battleSteps).toBeDefined();
    expect(battleSteps instanceof Array).toBeTruthy();
    expect(battleSteps.length).toBe(0);

    battleSteps = ActionExecutor.execute({}, battleContext);

    expect(battleSteps).toBeDefined();
    expect(battleSteps instanceof Array).toBeTruthy();
    expect(battleSteps.length).toBe(0);
});

test('Agent hit action', () => {
    const battleContext = new BattleContext();
    /** @type {Action} */
    const hitAction = {
        playerAction: {
            srcPlayer: new BattlePlayer(),
            targetPlayer: new BattlePlayer(),
            type: PlayerActionType.Physical,
            style: PlayerActionStyle.Sword,
            baseDamage: 10
        }
    };

    let battleSteps = ActionExecutor.execute(hitAction, battleContext);

    expect(battleSteps.length).toBeGreaterThan(0);
    expect(battleSteps[0].type).toMatch('damage');
});

test('Elements', () => {
    chatRPGUtility.random = seedrandom('1');
    
    const battleContext = new BattleContext();
    /** @type {Action} */
    const hitAction = {
        playerAction: {
            srcPlayer: new BattlePlayer(),
            targetPlayer: new BattlePlayer(),
            type: PlayerActionType.Physical,
            style: PlayerActionStyle.Sword,
            baseDamage: 10,
            elements: ['fire']
        }
    };

    let battleSteps = ActionExecutor.execute(hitAction, battleContext);
    const ablazeStep = /**@type {AddEffectStep}*/(findBattleStep('addEffect', battleSteps));

    expect(ablazeStep.effect.className).toMatch('AblazedEffect');
});

test('True Damage', () => {
    const battleContext = new BattleContext();
    /** @type {Action} */
    const hitAction = {
        playerAction: {
            srcPlayer: new BattlePlayer(),
            targetPlayer: new BattlePlayer(),
            type: PlayerActionType.Physical,
            trueDamage:20
        }
    };

    let battleSteps = ActionExecutor.execute(hitAction, battleContext);

    expect(battleSteps.length).toBeGreaterThan(0);
    expect(battleSteps[0].type).toMatch('damage');
});


test('Info action', () => {
    const battleContext = new BattleContext();
    /** @type {Action} */
    const infoAction = {
        infoAction: {
            description: 'Hello World'
        }
    };

    let battleSteps = ActionExecutor.execute(infoAction, battleContext);

    expect(battleSteps.length).toBe(1);
    expect(battleSteps[0].type).toMatch('info');
    expect(battleSteps[0].description).toMatch('Hello World');
    expect(/** @type {InfoBattleStep} */(battleSteps[0]).action).toMatch('generic');
});

test('Strike Level change', () => {
    const battleContext = new BattleContext();
    const player = new BattleAgent({id: 'player'});
    /** @type {Action} */
    const strikeLevelAction = {
        playerAction: {
            targetPlayer: player,
            type: PlayerActionType.Physical,
            style: PlayerActionStyle.Staff,
            strikeLevelChange: 1
        }
    }

    let battleSteps = ActionExecutor.execute(strikeLevelAction, battleContext);

    expect(battleSteps.length).toBe(1);

    const strikeLevelStep = /** @type {import("../battle-steps").SStrikeLevelChangeStep} */(battleSteps[0]);

    expect(strikeLevelStep.type).toMatch('strikeLevelChange');
    expect(strikeLevelStep.netChange).toBe(1);
    expect(strikeLevelStep.targetId).toBe('player');
});

test('AP change', () => {
    const battleContext = new BattleContext();
    const player = new BattleAgent({id: 'player'});
    /** @type {Action} */
    const apChangeAction = {
        playerAction: {
            targetPlayer: player,
            type: PlayerActionType.Physical,
            style: PlayerActionStyle.Staff,
            apChange: -1
        }
    }

    let battleSteps = ActionExecutor.execute(apChangeAction, battleContext);

    expect(battleSteps.length).toBe(1);

    const apStep = /** @type {import("../battle-steps").SApChangeBattleStep} */(battleSteps[0]);

    expect(apStep.type).toMatch('apChange');
    expect(apStep.netChange).toBe(-1);
    expect(apStep.targetId).toBe('player');
});

test("Consume Item", () => {
    const battleContext = new BattleContext();
    const player = new BattlePlayer({id: "player"});

    /** @type {Action} */
    const action = {
        playerAction: {
            targetPlayer: player,
            type: '',
            style: '',
            consumeItem: 'testItem'
        }
    };

    let battleSteps = ActionExecutor.execute(action, battleContext);

    expect(battleSteps.length).toBe(1);

    const consumeStep = /** @type {ConsumeItemStep} */ (battleSteps[0]);

    expect(consumeStep.type).toMatch("consumeItem");
    expect(consumeStep.targetId).toMatch("player");

});

test("Heal", () => {
    const battleContext = new BattleContext();
    const player = new BattleAgent({id: 'player', health: 1});
    /** @type {Action} */
    const apChangeAction = {
        playerAction: {
            targetPlayer: player,
            type: PlayerActionType.Physical,
            style: PlayerActionStyle.Staff,
            heal: 5
        }
    }

    let battleSteps = ActionExecutor.execute(apChangeAction, battleContext);

    const apStep = /** @type {HealStep} */(battleSteps[0]);

    expect(apStep.type).toMatch('heal');
    expect(apStep.healAmount).toBe(5);
    expect(apStep.targetId).toBe('player');
});

describe.each([
    ['revive', 'revive'],
    ['heal', 'heal'],
    ['absorb', 'heal', 1, {baseDamage: 10}],
    ['trueDamage', 'damage'],
    ['protection', 'protection', 0, {}, {physical: 5}],
    ['addAbility', 'addAbility', 0, {}, new Ability().getData()],
    ['removeAbility', 'removeAbility', 0, {}, 'coolAbility']
// @ts-ignore
])('%s test', (field, stepType, index=0, data={}, value=0.5) => {
    test('Basic', () => {
        const battleContext = new BattleContext();
        const player = battleContext.player;
        /** @type {Action} */
        const apChangeAction = {
            playerAction: {
                targetPlayer: player,
                srcPlayer: player,
                type: PlayerActionType.Physical,
                style: PlayerActionStyle.Staff,
                [field]: value,
                ...data
            }
        }

        let battleSteps = ActionExecutor.execute(apChangeAction, battleContext);

        const reviveStep = /** @type {ReviveStep} */(battleSteps[index]);

        expect(reviveStep.type).toMatch(stepType);
        expect(reviveStep.targetId).toBe('player');
    });
})

test('Defence Penetration', () => {
    const battleContext = new BattleContext();
    battleContext.player.setStatsAtLevel(100);
    /** @type {Action} */
    const damageAction = {
        playerAction: {
            targetPlayer: battleContext.player,
            srcPlayer: battleContext.player,
            type: PlayerActionType.Physical,
            style: PlayerActionStyle.Staff,
            baseDamage: 10
        }
    }

    let battleSteps = ActionExecutor.execute(damageAction, battleContext);
    // @ts-ignore
    damageAction.playerAction.defensePen = 0.5;
    let penBattleSteps = ActionExecutor.execute(damageAction, battleContext);

    const damageStep = /** @type {DamageStep} */(findBattleStep('damage', battleSteps));
    const penDamageStep = /** @type {DamageStep} */(findBattleStep('damage', penBattleSteps));

    expect(penDamageStep.damage).toBeGreaterThan(damageStep.damage);
});

test('Add Effect', () => {
    const battleContext = new BattleContext();

    /** @type {Action} */
    const effectAction = {
        battleContextAction: {
            addEffect: {
                targetId: battleContext.player.getData().id,
                className: 'AblazedEffect',
                inputData: {}
            },
            
        }
    };

    const battleSteps = ActionExecutor.execute(effectAction, battleContext);
    const effectStep = /**@type {AddEffectStep} */(battleSteps[0]);

    expect(effectStep.type).toMatch('addEffect');
    expect(effectStep.successful).toBeTruthy();
    expect(effectStep.effect.className).toMatch('AblazedEffect');
});

test('Remove Effect', () => {
    const battleContext = new BattleContext();
    const testEffect = new Effect(battleContext.player, {});
    battleContext.addEffect(testEffect);

    /** @type {Action} */
    const effectAction = {
        battleContextAction: {
            removeEffect: testEffect,
            
        }
    };

    const battleSteps = ActionExecutor.execute(effectAction, battleContext);
    const effectStep = /**@type {AddEffectStep} */(battleSteps[0]);

    expect(effectStep.type).toMatch('removeEffect');
    expect(effectStep.successful).toBeTruthy();
    expect(effectStep.effect.className).toMatch(testEffect.className);
});

describe.each([
    ['defenseAmp', 'defenseAmp'],
    ['strengthAmp', 'strengthAmp'],
    ['weaponSpeedAmp', 'speedAmp'],
    ['lightningResistAmp', 'lightningResistAmp']
])('%s test', (statAmp, stepType) => {
    test('Stat increase action', () => {
        const battleContext = new BattleContext();
        
        /** @type {Action} */
        let statAction = {
            playerAction: {
                targetPlayer: new BattlePlayer(),
                [statAmp]: 2
            }
        };

        const battleSteps = ActionExecutor.execute(statAction, battleContext);

        expect(battleSteps.length).toBe(1);
        expect(battleSteps[0].type).toMatch(stepType);

        let statModStep = /**@type {StatAmpStep} */(battleSteps[0]);

        expect(statModStep.ampAmount).toBe(2);
        
    });
    test('Stat decrease action', () => {
        
        const battleContext = new BattleContext();
        /** @type {Action} */
        let statAction = {
            playerAction: { 
                targetPlayer: new BattlePlayer(),
                [statAmp]: -2
            }
        };

        const battleSteps = ActionExecutor.execute(statAction, battleContext);

        expect(battleSteps.length).toBe(1);
        expect(battleSteps[0].type).toMatch(stepType);

        let statModStep = /**@type {StatAmpStep} */(battleSteps[0]);

        expect(statModStep.ampAmount).toBe(-2);
        
    });
});

test('Action Generator Mod', () => {
    const battleContext = new BattleContext();
    const strikeMove = new StrikeBattleMove(battleContext.player);
    const actionGenerator = strikeMove.onActivate(battleContext);

    /**@type {(data: StrikeBattleMoveData) => void} */
    const modFunction = (data) => {
        data.strikeData.apChange += 2;
    }

    /** @type {Action} */
    const modAction = {
        actionGeneratorAction: {
            targetActionGenerator: actionGenerator,
            modFunction,
            action: 'buff',
            targetId: battleContext.player.getData().id,
            description: 'Buffing player'
        }
    };

    const steps = ActionExecutor.execute(modAction, battleContext);

    expect(steps.length).toBe(1);
    expect(steps[0].type).toBe('actionGenMod');

    const actionGenModStep = /**@type {ActionGeneratorDataModStep} */(steps[0]);

    expect(actionGenModStep.action).toBe('buff');
    expect(actionGenModStep.targetId).toBe('player');
});

test('Action Data Mod', () => {
    const battleContext = new BattleContext();

    /**@type {(data: Action) => void} */
    const modFunction = (data) => {
        if (data.playerAction && data.playerAction.baseDamage) {
            data.playerAction.baseDamage += 10;
        }
    }

    /**@type {Action} */
    const action = {
        playerAction: {
            targetPlayer: battleContext.player,
            baseDamage: 10
        }
    };

    /** @type {Action} */
    const modAction = {
        actionModAction: {
            targetAction: action,
            modFunction,
            action: 'buff',
            targetId: 'player',
            description: 'Buffing player'
        }
    }

    const steps = ActionExecutor.execute(modAction, battleContext);

    expect(steps[0].type).toBe('actionMod');

    const actionGenModStep = /**@type {ActionDataModStep} */(steps[0]);

    expect(actionGenModStep.action).toBe('buff');
    expect(actionGenModStep.targetId).toBe('player');
});
