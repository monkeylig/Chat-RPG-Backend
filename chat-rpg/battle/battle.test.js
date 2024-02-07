const seedrandom = require('seedrandom');
const Ability = require("../datastore-objects/ability");
const { BattlePlayer, BattleMonster } = require("../datastore-objects/battle-agent");
const chatRPGUtility = require("../utility");
const { singlePlayerBattleIteration } = require("./battle");
const gameplayObjects = require('../gameplay-objects');

test('Trigger ablaze from ability', () => {
    chatRPGUtility.random = seedrandom('0');
    const player = new BattlePlayer({
        id: 'player',
        abilities: [
            new Ability({
                name: 'fireAbility',
                baseDamage: 10,
                elements: ['fire']
            }).getData()
        ]
    });
    const monster = new BattleMonster({
        id: 'monster'
    });

    player.setStatsAtLevel(10);
    monster.setStatsAtLevel(10);

    const battle = {
        player: player.getData(),
        monster: monster.getData(),
        gameId: 0,
        strikeAnim: '',
        environment: {},
        round: 1,
        active: true
    };

    const battleAction = {
        type: 'ability',
        abilityName: 'fireAbility'
    };
    let steps = singlePlayerBattleIteration(battle, battleAction);

    const ablazeStep = steps.find(step => step.type === 'gainStatusEffect');

    expect(ablazeStep).toBeDefined();
    expect(ablazeStep.statusEffect.name).toMatch('ablazed');
    expect(ablazeStep.targetId).toMatch(monster.getData().id);

    const damageStep = steps.findLast(step => step.type === 'damage');

    expect(damageStep).toBeDefined();
    expect(damageStep.damage).toBeGreaterThan(0);
    expect(damageStep.targetId).toMatch(monster.getData().id);

    const strikeAction = {
        type: 'strike'
    };

    for(let i=0; i < gameplayObjects.statusEffects.ablazed.roundsLeft - 1; i++) {
        steps = singlePlayerBattleIteration(battle, strikeAction);
    }

    expect(steps).toBeDefined();

    const removeStep = steps.findLast(step => step.type === 'removeStatusEffect');

    expect(removeStep).toBeDefined();
    expect(removeStep.statusEffect.name).toBe(gameplayObjects.statusEffects.ablazed.name);
    expect(removeStep.targetId).toBe(monster.getData().id);
});

test('Pop surged', () => {
    const player = new BattlePlayer({
        id: 'player',
        abilities: [
            new Ability({
                name: 'ability',
                baseDamage: 10,
            }).getData()
        ]
    });
    player.addStatusEffect(gameplayObjects.statusEffects.surged.name, gameplayObjects.statusEffects.surged);
    const monster = new BattleMonster({
        id: 'monster'
    });

    player.setStatsAtLevel(10);
    monster.setStatsAtLevel(10);

    const battle = {
        player: player.getData(),
        monster: monster.getData(),
        gameId: 0,
        strikeAnim: '',
        environment: {},
        round: 1,
        active: true
    };

    const battleAction = {
        type: 'ability',
        abilityName: 'ability'
    };
    let steps = singlePlayerBattleIteration(battle, battleAction);
    let index = steps.findIndex(element => element.action === 'surchedPop');

    expect(index).not.toBe(-1);
    expect(steps[index - 1].type).toBe('damage');
    expect(steps[index + 1].type).toBe('removeStatusEffect');
});