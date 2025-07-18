const monsterAi = require('./monster-ai');
const seedrandom = require('seedrandom');
const chatRPGUtility = require("../utility");
const { BattleMonster } = require('../datastore-objects/battle-agent');

test('Generic Monster AI', () => {
    chatRPGUtility.random = seedrandom('monsters!');
    const monster = new BattleMonster({
        level: 50,
        abilities: [
            {
                name: 'ability1',
            },
            {
                name: 'ability2',
                apCost: 1
            },
            {
                name: 'ability3',
                apCost: 1
            },
        ]
    });

    let actionRequest = monsterAi.genericAi(monster, {}, {});

    expect(actionRequest).toBeDefined();
    expect(actionRequest.type).toBe('ability');
    expect(actionRequest.abilityName).toBe('ability2');

    actionRequest = monsterAi.genericAi(monster, {}, {});

    expect(actionRequest).toBeDefined();
    expect(actionRequest.type).toBe('strikeAbility');

    monster.getData().ap = 0;
    actionRequest = monsterAi.genericAi(monster, {}, {});

    expect(actionRequest).toBeDefined();
    expect(actionRequest.type).toBe('strike');

    chatRPGUtility.random = seedrandom('3');
    monster.getData().ap = 1;
    actionRequest = monsterAi.genericAi(monster, {}, {});

    expect(actionRequest).toBeDefined();
    expect(actionRequest.type).toBe('strike');
});
