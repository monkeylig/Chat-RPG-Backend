/**
 * @import {BattleEndStep, InfoBattleStep} from "../battle-steps"
 */

const Ability = require("../../datastore-objects/ability");
const { BattlePlayer, BattleMonster, BattleWeapon } = require("../../datastore-objects/battle-agent");
const Item = require("../../datastore-objects/item");
const chatRPGUtility = require("../../utility");
const { BattleSystem } = require("../battle-system");
const seedrandom = require('seedrandom');

function testSuccessRate(testFunc, totalAttempts = 100) {
    let passes = 0;
    for(let i = 0; i < totalAttempts; i++) {
        const testResult = testFunc();
        if(testResult) {
            passes += 1;
        }
    }

    return passes / totalAttempts;
}

test.only("Basic strikes", () => {
    chatRPGUtility.random = seedrandom('0');
    
    const battle = {
        player: new BattlePlayer({id: 'player'}).getData(),
        monster: new BattleMonster({id: 'monster'}).getData(),
        gameId: '',
        strikeAnim: {},
        environment: {},
        round: 0,
        active: true,
        id: ''
    };
    const battleSystem = new BattleSystem(battle);

    const steps = battleSystem.singlePlayerBattleIteration({type: 'strike', battleId: ""});

    expect(steps.length).toBe(10);
    expect(steps[0].type).toMatch('info');
    expect(/** @type {InfoBattleStep} */(steps[0]).targetId).toMatch('player');
    expect(steps[1].type).toMatch('info');
    expect(steps[2].type).toMatch('damage');
    expect(/** @type {InfoBattleStep} */(steps[2]).targetId).toMatch('player');
    expect(steps[3].type).toMatch('strikeLevel');
    expect(/** @type {InfoBattleStep} */(steps[3]).targetId).toMatch('monster');
    expect(steps[4].type).toMatch('apChange');
    expect(/** @type {InfoBattleStep} */(steps[4]).targetId).toMatch('monster');
    expect(steps[5].type).toMatch('info');
    expect(/** @type {InfoBattleStep} */(steps[5]).targetId).toMatch('monster');
    expect(steps[6].type).toMatch('info');
    expect(steps[7].type).toMatch('damage');
    expect(/** @type {InfoBattleStep} */(steps[7]).targetId).toMatch('monster');
    expect(steps[8].type).toMatch('strikeLevel');
    expect(/** @type {InfoBattleStep} */(steps[8]).targetId).toMatch('player');
    expect(steps[9].type).toMatch('apChange');
    expect(/** @type {InfoBattleStep} */(steps[9]).targetId).toMatch('player');
});

test("Strike abilities", () => {
    chatRPGUtility.random = seedrandom('0');
    const battle = {
        player: new BattlePlayer({id: 'player'}).getData(),
        monster: new BattleMonster({id: 'monster'}).getData(),
        gameId: '',
        strikeAnim: {},
        environment: {},
        round: 0,
        active: true,
        id: ''
    };
    const battleSystem = new BattleSystem(battle);

    battleSystem.singlePlayerBattleIteration({type: 'strike', battleId: ""});
    battleSystem.singlePlayerBattleIteration({type: 'strike', battleId: ""});
    const steps = battleSystem.singlePlayerBattleIteration({type: 'strike', battleId: ""});

    expect(steps[0].type).toMatch('info');
    expect(/** @type {InfoBattleStep} */(steps[0]).action).toMatch('strikeAbility');
    expect(/** @type {InfoBattleStep} */(steps[0]).targetId).toMatch('monster');
    expect(/** @type {InfoBattleStep} */(steps[0]).actorId).toMatch('player');
    
});

test("Abilities", () => {
    const ability = new Ability({
        name: 'testAbility',
        target: 'opponent',
        baseDamage: 20,
        apCost: 1,
        speed: 20,
        animation: {}
    });

    const player = new BattlePlayer({id: 'player'});
    player.addAbility(ability.getData());

    const battle = {
        player: player.getData(),
        monster: new BattleMonster({id: 'monster'}).getData(),
        gameId: '',
        strikeAnim: {},
        environment: {},
        round: 0,
        active: true,
        id: ''
    };

    const battleSystem = new BattleSystem(battle);
    const steps = battleSystem.singlePlayerBattleIteration({type: 'ability', abilityName: 'testAbility', battleId: ""});

    expect(steps[0].type).toMatch('info');
    expect(/** @type {InfoBattleStep} */(steps[0]).action).toMatch('ability');
    expect(/** @type {InfoBattleStep} */(steps[0]).targetId).toMatch('monster');
    expect(/** @type {InfoBattleStep} */(steps[0]).actorId).toMatch('player');
    
});

test("Items", () => {
    const item = new Item({
        name: 'testItem',
        target: 'self',
        apChange: 3,
        apCost: 1,
        count: 2,
        animation: {}
    });

    const player = new BattlePlayer({id: 'player'});
    const itemContainer = player.addItemToBag(item);

    const battle = {
        player: player.getData(),
        monster: new BattleMonster({id: 'monster'}).getData(),
        gameId: '',
        strikeAnim: {},
        environment: {},
        round: 0,
        active: true,
        id: ''
    };

    const battleSystem = new BattleSystem(battle);
    const steps = battleSystem.singlePlayerBattleIteration({type: 'item', itemId: itemContainer?.id, battleId: ""});

    expect(steps[0].type).toMatch('info');
    expect(/** @type {InfoBattleStep} */(steps[0]).action).toMatch('item');
    expect(/** @type {InfoBattleStep} */(steps[0]).targetId).toMatch('player');
    expect(/** @type {InfoBattleStep} */(steps[0]).actorId).toMatch('player');

});

test("Escaping", () => {
    const battleSystem = new BattleSystem();
    const steps = battleSystem.singlePlayerBattleIteration({type: 'escape', battleId: ''});

    expect(steps[0].type).toMatch('info');
    const escapeInfo = /** @type {InfoBattleStep} */ (steps[0]);
    expect(escapeInfo.action).toMatch('escape');
    expect(steps[1].type).toMatch('battleEnd');
    const battleEndStep = /** @type {BattleEndStep} */ (steps[1]);
    expect(battleEndStep.status).toMatch('escape');
});

test("Losing Battles", () => {
    const monster = new BattleMonster({id: 'monster'});
    monster.getData().weapon.speed = 100;

    const battle = {
        player:  new BattlePlayer({id: 'player', health: 1}).getData(),
        monster: monster.getData(),
        gameId: '',
        strikeAnim: {},
        environment: {},
        round: 0,
        active: true,
        id: ''
    };

    const battleSystem = new BattleSystem(battle);
    const steps = battleSystem.singlePlayerBattleIteration({type: 'strike', battleId: ''});

    expect(battleSystem.battle.active).toBeFalsy();
    expect(battleSystem.battle.result?.winner).toMatch("monster");
    expect(battleSystem.battle.player.health).toBe(0);
    expect(battleSystem.battle.monster.health).toBeGreaterThan(0);

    const battleEnd = /** @type {BattleEndStep} */(steps[steps.length - 1]);

    expect(battleEnd.type).toMatch('battleEnd');
    expect(battleEnd.status).toMatch('defeat');
    expect(battleEnd.winner).toMatch('monster');
});

test("Winning Battles", () => {
    chatRPGUtility.random = seedrandom('5');
    const player = new BattlePlayer({id: 'player'});
    const monster = new BattleMonster({
        id: 'monster',
        health: 1,
        expYield: 500,
        weapon: new BattleWeapon({name: 'monster weapon'}).getData()
    })
    player.getData().weapon.speed = 100;

    const battle = {
        player: player.getData(),
        monster: monster.getData(),
        gameId: '',
        strikeAnim: {},
        environment: {},
        round: 0,
        active: true,
        id: ''
    };

    const battleSystem = new BattleSystem(battle);
    const steps = battleSystem.singlePlayerBattleIteration({type: 'strike', battleId: ''});

    expect(battleSystem.battle.active).toBeFalsy();
    expect(battleSystem.battle.monster.health).toBe(0);
    expect(battleSystem.battle.player.health).toBeGreaterThan(0);

    if(!battleSystem.battle.result) {
        fail();
    }
    expect(battleSystem.battle.result.winner).toMatch("player");
    expect(battleSystem.battle.result.expAward).toBeGreaterThan(0);
    expect(battleSystem.battle.result.levelGain).toBeGreaterThan(0);
    expect(battleSystem.battle.player.level).toBeGreaterThan(1);


    const battleEnd = /** @type {BattleEndStep} */(steps[steps.length - 1]);

    expect(battleEnd.type).toMatch('battleEnd');
    expect(battleEnd.status).toMatch('victory');
    expect(battleEnd.winner).toMatch('player');
});

test('Monster Weapon Drop rate', () => {
    chatRPGUtility.random = seedrandom('0');

    const weaponDropRate = 0.2;
    const dropRate = testSuccessRate(() => {
        const player = new BattlePlayer({id: 'player'});
        const monster = new BattleMonster({
            id: 'monster',
            health: 1,
            expYield: 5,
            weaponDropRate: weaponDropRate,
            weapon: new BattleWeapon({name: 'monster weapon'}).getData()
        })
        player.getData().weapon.speed = 100;

        const battle = {
            player: player.getData(),
            monster: monster.getData(),
            gameId: '',
            strikeAnim: {},
            environment: {},
            round: 0,
            active: true,
            id: ''
        };

        const battleSystem = new BattleSystem(battle);
        const steps = battleSystem.singlePlayerBattleIteration({type: 'strike', battleId: ''});
        if(!battleSystem.battle.result) {
            fail();
        }

        for(const drop of battleSystem.battle.result.drops) {
            if(drop.type === 'weapon') {
                expect(drop.content.name).toMatch('monster weapon');
                return true;
            }
        }
        return false;
    }, 100);

    expect(dropRate).toBeGreaterThan(weaponDropRate - 0.05);
    expect(dropRate).toBeLessThan(weaponDropRate + 0.05);
});

test('Monster Coin Drop rate', () => {
    chatRPGUtility.random = seedrandom('1');

    const coinDropRate = 1;
    const dropRate = testSuccessRate(() => {
        const player = new BattlePlayer({id: 'player'});
        player.getData().weapon.speed = 100;
        const monster = new BattleMonster({
            id: 'monster',
            expYield: 5,
        });
        monster.getData().health = 1;

        const battle = {
            player: player.getData(),
            monster: monster.getData(),
            gameId: '',
            strikeAnim: {},
            environment: {},
            round: 0,
            active: true,
            id: ''
        };

        const battleSystem = new BattleSystem(battle);
        const steps = battleSystem.singlePlayerBattleIteration({type: 'strike', battleId: ''});
        if(!battleSystem.battle.result) {
            fail();
        }

        for(const drop of battleSystem.battle.result.drops) {
            if(drop.type === 'coin') {
                return true;
            }
        }
        return false;
    }, 100);

    expect(dropRate).toBeGreaterThan(coinDropRate - 0.05);
    expect(dropRate).toBeLessThan(coinDropRate + 0.05);
});

test('Low level Monster Coin Drop rate', () => {
    chatRPGUtility.random = seedrandom('1');

    const coinDropRate = 0.3;
    const dropRate = testSuccessRate(() => {
        const player = new BattlePlayer({id: 'player'});
        player.setStatsAtLevel(10)
        player.getData().weapon.speed = 100;
        const monster = new BattleMonster({
            id: 'monster',
            expYield: 5,
        });
        monster.setStatsAtLevel(9);
        monster.getData().health = 1;

        const battle = {
            player: player.getData(),
            monster: monster.getData(),
            gameId: '',
            strikeAnim: {},
            environment: {},
            round: 0,
            active: true,
            id: ''
        };

        const battleSystem = new BattleSystem(battle);
        const steps = battleSystem.singlePlayerBattleIteration({type: 'strike', battleId: ''});
        if(!battleSystem.battle.result) {
            fail();
        }

        for(const drop of battleSystem.battle.result.drops) {
            if(drop.type === 'coin') {
                return true;
            }
        }
        return false;
    }, 100);

    expect(dropRate).toBeGreaterThan(coinDropRate - 0.05);
    expect(dropRate).toBeLessThan(coinDropRate + 0.05);
});