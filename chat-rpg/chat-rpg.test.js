/**
 * @import {SInfoBattleStep} from './battle-system/battle-steps'
 */

const ChatRPG = require('./chat-rpg');
const MemoryBackedDataSource = require('../data-source/memory-backed-data-source');
const chatRPGUtility = require('./utility');
const Schema = require("./datasource-schema");
const {Player} = require('./datastore-objects/agent');
const seedrandom = require('seedrandom');
const { Shop, ShopItem } = require('./datastore-objects/shop');
const GameModes = require('./game-modes');
const { Weapon } = require('./datastore-objects/weapon');
const ChatRPGErrors = require('./errors');
const Item = require('./datastore-objects/item');
const { InventoryPage } = require('./datastore-objects/inventory-page');
const { BookRequirement, Book } = require('./datastore-objects/book');
const gameplayObjects = require('./gameplay-objects');
const Ability = require('./datastore-objects/ability');

async function testSuccessRate(testFunc, totalAttempts = 100) {
    let passes = 0;
    for(let i = 0; i < totalAttempts; i++) {
        const testResult = await Promise.resolve(testFunc());
        if(testResult) {
            passes += 1;
        }
    }

    return passes / totalAttempts;
}

beforeAll(() => {
    GameModes.numberOfMonsters = 1;
  });

describe.each([
    ['physical', 'defense'],
    ['magical', 'defense'],
    ['physical', 'health'],
    ['magical', 'health'],
])('%s - %s New twitch player options', (weaponType, vitalityBonus) => {
    test('New unique player', async () => {
        const dataSource = new MemoryBackedDataSource();
        await dataSource.initializeDataSource();
        const chatrpg = new ChatRPG(dataSource);

        const name = 'jhard';
        const avatar = 'big-bad.png';
        const twitchId = 'f048932ujr';
        const defaultPlayer = new Player({name, avatar, twitchId});

        defaultPlayer.setStatsAtLevel(1);

        const newPlayer = await chatrpg.addNewPlayer(name, avatar, weaponType, vitalityBonus, twitchId, 'twitch');
        expect(newPlayer).toBeDefined();

        expect(newPlayer.twitchId).toMatch(defaultPlayer.getData().twitchId);
        expect(newPlayer.avatar).toMatch(defaultPlayer.getData().avatar);
        expect(newPlayer.name).toMatch(defaultPlayer.getData().name);
        expect(newPlayer.weapon).toStrictEqual(gameplayObjects.startingWeapons[weaponType]);

        if(vitalityBonus === 'defense') {
            expect(newPlayer.defense).toBe(defaultPlayer.getData().defense + 1);
        }

        if(vitalityBonus === 'health') {
            expect(newPlayer.maxHealth).toBe(defaultPlayer.getData().maxHealth + 2);
            expect(newPlayer.health).toBe(defaultPlayer.getData().health + 2);
        }

        // Make sure the same player can't be added twice
        await expect(chatrpg.addNewPlayer('jhard', 'big-bad.png', twitchId, 'twitch')).rejects.toThrow(ChatRPGErrors.playerExists);
    });
});

test('Testing getting starting avatars', async () => {
    const startingData = {
        avatars: {
            starting_avatars: {
                content: ['dolfin.png', 'eric.png', 'kris.png', 'jhard.png']
            }
        }
    };

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource(startingData);
    const chatrpg = new ChatRPG(dataSource);

    const avatars = await chatrpg.getStartingAvatars();

    expect(avatars).toStrictEqual(startingData.avatars.starting_avatars.content);

});

test('Testing finding a Twitch player', async () => {
    const dataSource = new MemoryBackedDataSource();
    const ochiva = {
        twitchId: 'hdyer'
    }

    const jhard = {
        twitchId: 'fr4wt4'
    }

    const kris = {
        twitchId: 'sfdz3'
    }

    await dataSource.initializeDataSource({
        [Schema.Collections.Accounts]: {
            ochiva,
            jhard,
            kris
        },
    });
    const chatrpg = new ChatRPG(dataSource);

    let player = await chatrpg.findPlayerById('hdyer', 'twitch');
    
    expect(player).toBeDefined();
    expect(player.id).toBe('ochiva');
    expect(player.twitchId).toBe('hdyer');

    await expect(chatrpg.findPlayerById('does not exist', 'twitch')).rejects.toThrow(ChatRPGErrors.playerNotFound);
});

test('Testing joining a Twitch game', async () => {
    let dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource();
    let chatrpg = new ChatRPG(dataSource);

    let playerId = await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'physical', 'health', 'fr4wt4', 'twitch');
    let gameState = await chatrpg.joinGame(playerId.id, 'new game');

    expect(gameState.id).toEqual('new game');
    expect(gameState.monsters.length).toBe(0);
    let players = dataSource.dataSource.accounts;

    for(player in players) {
        expect(players[player].currentGameId).toBe('new game');
    }

    //Add monsters so that new games can be properly created
    dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        monsters: {
            skellington: {
                monsterNumber: 0,
                strengthRating: 0.5
            },

            eye_sack: {
                monsterNumber: 1,
                strengthRating: 0.2
            },

            telemarketer: {
                monsterNumber: 2,
                strengthRating: 0.7
            }
        }
    });

    // Test with multiple players
    chatrpg = new ChatRPG(dataSource);
    
    playerId = await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'physical', 'health', 'gert43', 'twitch');
    let playerId2 = await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'physical', 'health', 'fr4wt4', 'twitch');

    gameState = await chatrpg.joinGame(playerId.id, 'new game2');
    const oldMonsterCount = gameState.monsters.length;

    expect(gameState.id).toEqual('new game2');
    expect(gameState.monsters.length).toBeGreaterThan(0);
    expect(gameState.monsters[0]).toHaveProperty("strength");
    expect(gameState.monsters[0]).toHaveProperty("defense");

    gameState = await chatrpg.joinGame(playerId2.id, 'new game2');

    expect(gameState.id).toEqual('new game2');
    expect(gameState.monsters.length).toBe(oldMonsterCount);
    expect(gameState.monsters[0]).toHaveProperty("strength");
    expect(gameState.monsters[0]).toHaveProperty("defense");

    players = dataSource.dataSource.accounts;

    for(player in players) {
        expect(players[player].currentGameId).toBe('new game2');
    }
});

test('Getting a game update', async () => {
    let dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        monsters: {
            skellington: {
                monsterNumber: 0,
                strengthRating: 0.5
            },

            eye_sack: {
                monsterNumber: 1,
                strengthRating: 0.2
            },

            telemarketer: {
                monsterNumber: 2,
                strengthRating: 0.7
            }
        }
    });
    let chatrpg = new ChatRPG(dataSource);

    let playerId = await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'physical', 'health', 'fr4wt4', 'twitch');
    await chatrpg.joinGame(playerId.id, 'new game');

    const gameUpdate = await chatrpg.getGame('new game', playerId.id);

    expect(gameUpdate.id).toEqual('new game');
    expect(gameUpdate.monsters.length).toBeGreaterThan(0);
    expect(gameUpdate.monsters[0]).toHaveProperty("strength");
    expect(gameUpdate.monsters[0]).toHaveProperty("defense");
});

test('Starting a battle', async () => {
    let player = new Player();
    player.datastoreObject.abilities = [
        {
            name: 'Big Bang',
            baseDamage: 50,
            speed: 1,
            effectName: 'testAbility1',
            apCost: 1
        }
    ];

    const dataSource = new MemoryBackedDataSource();
    //Add monsters so that new games can be properly created
    await dataSource.initializeDataSource({
        monsters: {
            skellington: {
                monsterNumber: 0,
                healthRating: 0.5,
                strengthRating: 0.5
            },

            eye_sack: {
                monsterNumber: 1,
                healthRating: 0.5,
                strengthRating: 0.2
            },

            telemarketer: {
                monsterNumber: 2,
                healthRating: 0.5,
                strengthRating: 0.7
            }
        },
        accounts: {
            player1: player.getData()
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    let gameState = await chatrpg.joinGame('player1', 'new game');
    let battleState = await chatrpg.startBattle('player1', gameState.id, gameState.monsters[0].id);

    expect(battleState).toBeTruthy();
    expect(battleState.player).toBeTruthy();
    expect(battleState.player.id).toMatch('player1');
    expect(battleState.player.abilities[0].name).toBeDefined();
    expect(battleState.monster).toBeTruthy();
    expect(battleState.gameId).toBe('new game');
    expect(battleState.monster.id).toBe(gameState.monsters[0].id);
    expect(battleState.monster.id).not.toBe(gameState.monsters[1].id);
    expect(battleState.monster.weaponDropRate).toBe(0.2);
    expect(battleState.monster.health).toBeTruthy();
    expect(battleState.monster.maxHealth).toBeTruthy();
});

test('Starting a battle with a monster thats does not exist', async () => {
    const dataSource = new MemoryBackedDataSource();
    //Add monsters so that new games can be properly created
    await dataSource.initializeDataSource({
        monsters: {
            skellington: {
                monsterNumber: 0,
                healthRating: 0.5,
                strengthRating: 0.5
            },

            eye_sack: {
                monsterNumber: 1,
                healthRating: 0.5,
                strengthRating: 0.2
            },

            telemarketer: {
                monsterNumber: 2,
                healthRating: 0.5,
                strengthRating: 0.7
            }
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    let playerId = await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'physical', 'health', 'fr4wt4', 'twitch');
    let gameState = await chatrpg.joinGame(playerId.id, 'new game');
    let battleState = await chatrpg.startBattle(playerId.id, gameState.id, 'No such monster', {monsterClass: 'telemarketer', level: 3});

    expect(battleState).toBeTruthy();
    expect(battleState.player).toBeTruthy();
    expect(battleState.player.id).toMatch(playerId.id);
    expect(battleState.monster).toBeTruthy();
    expect(battleState.gameId).toBe('new game');
    expect(battleState.monster.id).toBe('No such monster');
    expect(battleState.monster.id).not.toBe(gameState.monsters[1].id);
    expect(battleState.monster.health).toBeDefined();
    expect(battleState.monster.health).not.toBeNaN();
    expect(battleState.monster.maxHealth).toBeDefined();
    expect(battleState.monster.maxHealth).not.toBeNaN();

});

test('Battle Actions: Strike', async () => {
    const dataSource = new MemoryBackedDataSource();
    //Add monsters so that new games can be properly created
    await dataSource.initializeDataSource({
        monsters: {
            eye_sack: {
                monsterNumber: 0,
                strengthRating: 0.2,
                defenseRating: 0.2,
                healthRating: 0.4,
                magicRating: 0.2,
                name: "Eye Sack",
                weapon: new Weapon ({
                    baseDamage: 10,
                    name: "Cornia",
                    type: 'physical',
                    speed: 1,
                    strikeAbility: {
                        baseDamage: 20,
                        name: "X ray"
                    }
                }).getData()
            }
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    let playerId = await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'physical', 'health', 'fr4wt4', 'twitch');
    let gameState = await chatrpg.joinGame(playerId.id, 'new game');
    let battleState = await chatrpg.startBattle(playerId.id, gameState.id, gameState.monsters[0].id);

    const battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});

    expect(battleUpdate).toBeTruthy();
    expect(battleUpdate.result).toBeUndefined();
    expect(battleUpdate.steps).toBeTruthy();
    expect(battleUpdate.steps.length).toBe(10);
});

test('Battle Actions: Strike Ability', async () => {
    const dataSource = new MemoryBackedDataSource();
    //Add monsters so that new games can be properly created
    await dataSource.initializeDataSource({
        monsters: {
            eye_sack: {
                monsterNumber: 0,
                strengthRating: 0.2,
                defenseRating: 0.2,
                healthRating: 1,
                magicRating: 0.2,
                name: "Eye Sack",
                weapon: new Weapon ({
                    baseDamage: 10,
                    name: "Cornia",
                    type: 'physical',
                    speed: 10,
                    strikeAbility: new Ability({
                        baseDamage: 20,
                        name: "X ray"
                    }).getData()
                }).getData()
            }
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    let playerId = await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'physical', 'health', 'fr4wt4', 'twitch');
    let gameState = await chatrpg.joinGame(playerId.id, 'new game');
    let battleState = await chatrpg.startBattle(playerId.id, gameState.id, gameState.monsters[0].id);

    let battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});

    expect(battleUpdate.steps[0].description).toMatch(/X ray/);
});


test('Magic Strike', async () => {
    const dataSource = new MemoryBackedDataSource();
    //Add monsters so that new games can be properly created
    await dataSource.initializeDataSource({
        monsters: {
            eye_sack: {
                monsterNumber: 0,
                strengthRating: 0.2,
                defenseRating: 0.2,
                healthRating: 0.4,
                magicRating: 0.2,
                name: "Eye Sack",
                weapon: new Weapon ({
                    baseDamage: 10,
                    name: "Cornia",
                    type: 'magical',
                    speed: 1,
                    strikeAbility: new Ability({
                        baseDamage: 20,
                        name: "X ray"
                    }).getData()
                }).getData()
            }
        }
    });
    
    const magicWeapon = new Weapon({
        name: 'Magic Fists',
        baseDamage: 10,
        speed: 30,
        type: 'magical',
        strikeAbility: new Ability({
            name: 'Heavy Blast',
            baseDamage: 30,
            modifier: 'magic',
        }).getData(),
        statGrowth: {
            maxHealth: 2,
            strength: 1,
            magic: 1,
            defense: 1
        }
    }).getData();

    let chatrpg = new ChatRPG(dataSource);

    let playerId = await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'fr4wt4', 'twitch');
    let gameState = await chatrpg.joinGame(playerId.id, 'new game');

    dataSource.dataSource[Schema.Collections.Accounts][playerId.id].weapon = magicWeapon;
    dataSource.dataSource[Schema.Collections.Accounts][playerId.id].strength = 0;
    dataSource.dataSource[Schema.Collections.Accounts][playerId.id].magic = 10;

    let battleState = await chatrpg.startBattle(playerId.id, gameState.id, gameState.monsters[0].id);
    let battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});

    expect(battleUpdate.steps[2].type).toMatch('damage');
    expect(battleUpdate.steps[2].damage).toBeGreaterThan(2);

});

test('Battle Actions: Ability', async () => {
    let player = new Player();
    player.datastoreObject.abilities = [
            new Ability({
                name: 'Big Bang',
                type: 'magical',
                baseDamage: 50,
                apCost: 1
            }).getData()
    ];

    player.datastoreObject.strength = 0;
    player.datastoreObject.magic = 10;
    const dataSource = new MemoryBackedDataSource();
    //Add monsters so that new games can be properly created
    await dataSource.initializeDataSource({
        monsters: {
            eye_sack: {
                monsterNumber: 0,
                strengthRating: 0.2,
                defenseRating: 0.2,
                healthRating: 40,
                magicRating: 0.2,
                name: "Eye Sack",
                weapon: new Weapon ({
                    baseDamage: 10,
                    name: "Cornia",
                    speed: 1,
                    strikeAbility: new Ability({
                        baseDamage: 20,
                        name: "X ray"
                    }).getData()
                }).getData()
            }
        },
        accounts: {
            player1: player.getData()
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    let gameState = await chatrpg.joinGame('player1', 'new game');
    let battleState = await chatrpg.startBattle('player1', gameState.id, gameState.monsters[0].id);

    let battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'ability', abilityName: 'Big Bang'});

    let battleObject;
    for(const _battle in dataSource.dataSource.battles) {
        battleObject = dataSource.dataSource.battles[_battle];
    }

    let abilityFound = false;
    for(const step of battleUpdate.steps) {
        if(step.type !== 'info') {
            continue;
        }
        const infoStep = /**@type {SInfoBattleStep} */(step);
        if(infoStep.action === 'ability') {
            expect(infoStep.description).toMatch(/Big Bang/);
            abilityFound = true;
        }
    }
    expect(abilityFound).toBeTruthy();

    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'ability', abilityName: 'Big Bang'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'ability', abilityName: 'Big Bang'});
    await expect(chatrpg.battleAction(battleState.id, {type: 'ability', abilityName: 'Big Bang'})).rejects.toThrow(ChatRPGErrors.notEnoughAp);


});

test('Battle Actions: Item', async () => {
    let player = new Player();
    player.addItemToBag(new Item({
        name: 'Big Bang',
        count: 2,
    }));
    player.addItemToBag(new Item({
        name: 'Small Bang',
        count: 1,
    }));

    const dataSource = new MemoryBackedDataSource();
    //Add monsters so that new games can be properly created
    await dataSource.initializeDataSource({
        monsters: {
            eye_sack: {
                monsterNumber: 0,
                strengthRating: 0.2,
                defenseRating: 0.2,
                healthRating: 0.4,
                magicRating: 0.2,
                name: "Eye Sack",
                weapon: new Weapon ({
                    baseDamage: 10,
                    name: "Cornia",
                    type: 'physical',
                    speed: 1,
                    strikeAbility: new Ability({
                        baseDamage: 20,
                        name: "X ray"
                    }).getData()
                }).getData()
            }
        },
        accounts: {
            player1: player.getData()
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    let gameState = await chatrpg.joinGame('player1', 'new game');
    let battleState = await chatrpg.startBattle('player1', gameState.id, gameState.monsters[0].id);

    let battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'item', itemId: player.getData().bag.objects[0].id});

    let itemFound = false;
    for(const step of battleUpdate.steps) {
        if(step.type !== 'info') {
            continue;
        }
        const infoStep = /**@type {SInfoBattleStep} */(step);

        if (infoStep.action === 'item') {
            expect(infoStep.description).toMatch(/Big Bang/);
            itemFound = true
        }
    }

    expect(itemFound).toBeTruthy();

    const itemId = player.getData().bag.objects[1].id;
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'item', itemId: itemId});

    await expect(chatrpg.battleAction(battleState.id, {type: 'item', itemId: itemId})).rejects.toThrow(ChatRPGErrors.itemNotEquipped);

});

test('Defeating a monster', async () => {
    const player = new Player();
    player.getData().weapon.baseDamage = 1000;
    player.getData().weapon.style = 'sword';
    const dataSource = new MemoryBackedDataSource();
    //Add monsters so that new games can be properly created
    await dataSource.initializeDataSource({
        monsters: {
            eye_sack: {
                monsterNumber: 0,
                strengthRating: 0.2,
                defenseRating: 0.2,
                healthRating: 0.1,
                magicRating: 0.2,
                expYield: 36,
                name: "Eye Sack",
                weapon: new Weapon({
                    baseDamage: 10,
                    name: "Cornia",
                    type: 'physical',
                    speed: 1,
                    strikeAbility: new Ability({
                        baseDamage: 20,
                        name: "X ray"
                    }).getData()
                }).getData()
            }
        },
        accounts: {
            player1: player.getData()
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    let gameState = await chatrpg.joinGame('player1', 'new game');
    let battleState = await chatrpg.startBattle('player1', gameState.id, gameState.monsters[0].id);

    let battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});

    expect(battleUpdate.monster.health).toBe(0);

    if(!battleUpdate.result) {
        fail();
    }

    expect(battleUpdate.result.winner).toMatch(battleState.player.id);
    expect(battleUpdate.result.expAward).toBeDefined();
    expect(battleUpdate.result.expAward).toBe(chatRPGUtility.getMonsterExpGain(battleUpdate.monster));
    expect(battleUpdate.player.level).toBe(2);

    const gameUpdate = await chatrpg.getGame('new game');

    expect(gameUpdate.monsters.includes(battleUpdate.monster.id)).toBeFalsy();

    const playerData = await chatrpg.findPlayerById('player1');

    expect(playerData.level).toBe(2);
    expect(playerData.trackers).toBeDefined();
    expect(playerData.trackers.weaponKills).toBeDefined();
    expect(playerData.trackers.weaponKills.sword).toBe(1);

    await expect(chatrpg.battleAction(battleState.id, {type: 'strike'})).rejects.toThrow(ChatRPGErrors.battleNotFound);

});

test('Player being defeated', async () => {
    const dataSource = new MemoryBackedDataSource();
    //Add monsters so that new games can be properly created
    await dataSource.initializeDataSource({
        monsters: {
            eye_sack: {
                monsterNumber: 0,
                strengthRating: 0.2,
                defenseRating: 0.2,
                healthRating: 20,
                magicRating: 0.2,
                expYield: 36,
                name: "Eye Sack",
                weapon: new Weapon ({
                    baseDamage: 1000,
                    name: "Cornia",
                    type: 'physical',
                    speed: 1,
                    strikeAbility: {
                        baseDamage: 20,
                        name: "X ray"
                    }
                }).getData()
            }
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    let playerId = await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'physical', 'health', 'fr4wt4', 'twitch');
    let gameState = await chatrpg.joinGame(playerId.id, 'new game');
    let battleState = await chatrpg.startBattle(playerId.id, gameState.id, gameState.monsters[0].id);

    let battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});

    expect(battleUpdate.player.health).toBe(0);

    if (!battleUpdate.result) {
        fail();
    }

    expect(battleUpdate.result.winner).toMatch(battleState.monster.id);

    const player = await chatrpg.findPlayerById(playerId.id);

    expect(player.health).toBe(Math.floor(player.maxHealth));
    expect(player.trackers.deaths).toBe(1);
});

test.skip('Player being revived', async () => {
    let player = new Player({autoRevive: 0.75});
    const dataSource = new MemoryBackedDataSource();
    //Add monsters so that new games can be properly created
    await dataSource.initializeDataSource({
        monsters: {
            eye_sack: {
                monsterNumber: 0,
                strengthRating: 0.2,
                defenseRating: 0.2,
                healthRating: 20,
                magicRating: 0.2,
                expYield: 36,
                name: "Eye Sack",
                weapon: new Weapon({
                    baseDamage: 10,
                    name: "Cornia",
                    type: 'physical',
                    speed: 1,
                    strikeAbility: {
                        baseDamage: 20,
                        name: "X ray"
                    }
                }).getData()
            }
        },
        [Schema.Collections.Accounts]: {
            player1: player.getData()
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    let gameState = await chatrpg.joinGame('player1', 'new game');
    let battleState = await chatrpg.startBattle('player1', gameState.id, gameState.monsters[0].id);

    let battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});

    expect(battleUpdate.result).not.toBeDefined();
    expect(battleUpdate.player.autoRevive).toBe(0);

    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});

    expect(battleUpdate.result).toBeDefined();

    const playerData = await chatrpg.findPlayerById('player1');

    expect(playerData.autoRevive).toBe(0);

});

test('Unlocking abilities after battle', async () => {
    chatRPGUtility.random = seedrandom('0');
    const testBook = new Book({
        name: 'test book',
        icon: 'tome_azure.webp',
        abilities: [
            {
                requirements: [
                    new BookRequirement({
                        description: 'Slay 1 monsters with a melee style weapon.',
                        requiredCount: 1,
                        tracker: {
                            type: 'weaponStyleVictory',
                            value: 'melee'
                        }
                    }).getData()
        
                ],
                ability: {
                    name: 'ability 1'
                }
            },
            {
                requirements: [
                    new BookRequirement({
                        description: 'Slay 1 monsters with a melee style weapon.',
                        requiredCount: 1,
                        tracker: {
                            type: 'weaponStyleVictory',
                            value: 'melee'
                        }
                    }).getData()
        
                ],
                ability: {
                    name: 'ability 2'
                }
            }
        ]
    });
    let player = new Player();
    player.addBookToBag(testBook.getData());
    player.setStatsAtLevel(10);
    const dataSource = new MemoryBackedDataSource();
    //Add monsters so that new games can be properly created
    await dataSource.initializeDataSource({
        monsters: {
            eye_sack: {
                monsterNumber: 0,
                strengthRating: 0,
                defenseRating: 0.2,
                healthRating: 0.01,
                magicRating: 0,
                expYield: 36,
                name: "Eye Sack",
                weapon: new Weapon({
                    baseDamage: 10,
                    name: "Cornia",
                    type: 'physical',
                    speed: 1,
                    strikeAbility: {
                        baseDamage: 20,
                        name: "X ray"
                    }
                }).getData()
            }
        },
        [Schema.Collections.Accounts]: {
            player1: player.getData()
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    let gameState = await chatrpg.joinGame('player1', 'new game');
    let battleState = await chatrpg.startBattle('player1', gameState.id, gameState.monsters[0].id);

    let battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    if (!battleUpdate.result) {
        fail();
    }

    expect(battleUpdate.result.drops.length).toBe(1);
    expect(battleUpdate.result.drops[0].type).toBe('abilitiesUnlock');
    expect(battleUpdate.result.drops[0].content).toBeDefined();

});

test('Monster Drops', async () => {
    chatRPGUtility.random = seedrandom('0');
    let playerId = 'pid';
    const dataSource = new MemoryBackedDataSource();
    //Add monsters so that new games can be properly created
    await dataSource.initializeDataSource({
        monsters: {
            eye_sack: {
                monsterNumber: 0,
                strengthRating: 0.2,
                defenseRating: 0.2,
                healthRating: 0.1,
                magicRating: 0.2,
                weaponDropRate: 1,
                expYield: 36,
                name: "Eye Sack",
                weapon: new Weapon({
                    baseDamage: 10,
                    name: "Cornia",
                    type: 'physical',
                    speed: 1,
                    strikeAbility: {
                        baseDamage: 20,
                        name: "X ray"
                    }
                }).getData()
            }
        },
        [Schema.Collections.Accounts]: {
            [playerId]: new Player({
                weapon: new Weapon({
                    baseDamage: 1000
                }).getData()
            }).getData()
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    let gameState = await chatrpg.joinGame(playerId, 'new game');
    let battleState = await chatrpg.startBattle(playerId, gameState.id, gameState.monsters[0].id);

    let battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    if (!battleUpdate.result) {
        fail();
    }

    expect(battleUpdate.result.drops.length).toBeGreaterThan(0);
    expect(battleUpdate.result.drops[0].type).toMatch('weapon');
    expect(battleUpdate.result.drops[0].content.name).toMatch(battleUpdate.monster.weapon.name);
    expect(battleUpdate.result.drops[1]).toBeDefined();
    expect(battleUpdate.result.drops[1].type).toMatch('coin');
    expect(battleUpdate.result.drops[1].content).toBeDefined();

    const player = await chatrpg.findPlayerById(playerId);

    expect(player.bag.objects.length).toBeGreaterThan(0);
    expect(player.bag.objects[0].content.name).toMatch(battleUpdate.monster.weapon.name);
});

test('Low level monster coin drop rate', async () => {
    const expectedDropRate = 0.3;
    const marginOfError = 0.15;

    const coinDropRate = await testSuccessRate(async () => {
        const player = new Player({name: 'jhard'});
        player.setStatsAtLevel(10);
        const dataSource = new MemoryBackedDataSource();
        //Add monsters so that new games can be properly created
        await dataSource.initializeDataSource({
            accounts: {
                player1: player.getData()
            },
            monsters: {
                eye_sack: {
                    monsterNumber: 0,
                    strengthRating: 0.2,
                    defenseRating: 0.2,
                    healthRating: 0.1,
                    magicRating: 0.2,
                    expYield: 36,
                    name: "Eye Sack",
                    weapon: {
                        baseDamage: 10,
                        name: "Cornia",
                        type: 'physical',
                        speed: 1,
                        strikeAbility: {
                            baseDamage: 20,
                            name: "X ray"
                        }
                    }
                }
            }
        });

        let chatrpg = new ChatRPG(dataSource);

        let gameState = await chatrpg.joinGame('player1', 'new game');
        let battleState = await chatrpg.startBattle('player1', gameState.id, gameState.monsters[0].id);

        let battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});

        if (!battleUpdate.result) {
            fail();
        }

        for(const drop of battleUpdate.result.drops) {
            if(drop.type == 'coin') {
                return true;
            }
        }

        return false;
    });

    expect(coinDropRate).toBeGreaterThanOrEqual(expectedDropRate - marginOfError);
    expect(coinDropRate).toBeLessThanOrEqual(expectedDropRate + marginOfError);
});

test('Monster Drops with bag full', async () => {
    chatRPGUtility.random = seedrandom('5');
    const defaultPlayer = new Player({
        name: 'jhard',
        avatar: 'big-bad.png',
        twitchId: 'fr4wt4',
        weapon: new Weapon({
            baseDamage: 1000
        }).getData()
    });
    const fillerWeapon = new Weapon({
        baseDamage: 10,
        name: "bat",
        speed: 1,
        strikeAbility: {
            baseDamage: 20,
            name: "swing"
        }
    });

    while(defaultPlayer.addWeaponToBag(fillerWeapon)){}

    const dataSource = new MemoryBackedDataSource();
    //Add monsters so that new games can be properly created
    await dataSource.initializeDataSource({
        [Schema.Collections.Accounts]: {
            testPlayer: defaultPlayer.getData()
        }, 
        monsters: {
            eye_sack: {
                monsterNumber: 0,
                strengthRating: 0.2,
                defenseRating: 0.2,
                healthRating: 0.1,
                magicRating: 0.2,
                expYield: 36,
                weaponDropRate: 1,
                name: "Eye Sack",
                weapon: new Weapon({
                    baseDamage: 10,
                    name: "Cornia",
                    type: 'physical',
                    speed: 1,
                    strikeAbility: {
                        baseDamage: 20,
                        name: "X ray"
                    }
                }).getData()
            }
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    let gameState = await chatrpg.joinGame('testPlayer', 'new game');
    let battleState = await chatrpg.startBattle('testPlayer', gameState.id, gameState.monsters[0].id);

    let battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});

    const player = await chatrpg.findPlayerById('fr4wt4', 'twitch');
    expect(player.lastDrops.objects.length).toBeGreaterThan(0);
    expect(player.lastDrops.objects[0].content.name).toMatch(battleUpdate.monster.weapon.name);
});

test('Monster does not drop weapon', async () => {
    chatRPGUtility.random = seedrandom('Chat RPG!');
    let playerId = 'pid';

    const dataSource = new MemoryBackedDataSource();
    //Add monsters so that new games can be properly created
    await dataSource.initializeDataSource({
        monsters: {
            eye_sack: {
                monsterNumber: 0,
                strengthRating: 0.2,
                defenseRating: 0.2,
                healthRating: 0.1,
                magicRating: 0.2,
                expYield: 36,
                name: "Eye Sack",
                weapon: new Weapon({
                    baseDamage: 10,
                    name: "Cornia",
                    type: 'physical',
                    speed: 1,
                    strikeAbility: {
                        baseDamage: 20,
                        name: "X ray"
                    }
                }).getData()
            }
        },
        [Schema.Collections.Accounts]: {
            [playerId]: new Player()
        },
    });

    let chatrpg = new ChatRPG(dataSource);

    let gameState = await chatrpg.joinGame(playerId, 'new game');
    let battleState = await chatrpg.startBattle(playerId, gameState.id, gameState.monsters[0].id);

    let battleUpdate;
    do {
        battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    } while(!battleUpdate.result)

    const player = await chatrpg.findPlayerById(playerId);
    expect(player.bag.objects.length).toBe(0);
    expect(player.lastDrops.objects.length).toBe(0);

    for(const drop of battleUpdate.result.drops) {
        expect(drop.type).not.toMatch('weapon');
    }
});

test('Equip weapon', async () => {
    let player = new Player();
    player.addWeaponToBag(new Weapon({name: 'sword'}));
    const weaponId = player.datastoreObject.bag.objects[0].id;
    
    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        accounts: {
            player1: player.getData()
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    let playerData = await chatrpg.equipWeapon('player1', weaponId);

    expect(playerData.weapon).toBeTruthy();
    expect(playerData.weapon.name).toMatch('sword');

    playerData = dataSource.dataSource.accounts.player1;

    expect(playerData.weapon).toBeTruthy();
    expect(playerData.weapon.name).toMatch('sword');
});

test('Player drop weapon', async () => {
    let player = new Player();
    player.addWeaponToBag(new Weapon({name: 'sword'}));
    player.addWeaponToBag(new Weapon({name: 'sword2'}));
    const weaponId = player.datastoreObject.bag.objects[0].id;

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        accounts: {
            player1: player.getData()
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    let playerData = await chatrpg.dropObjectFromBag('player1', weaponId);

    expect(playerData.bag.objects.length).toBe(1);
    expect(playerData.bag.objects[0].content.name).toMatch('sword2');
});

test('Equip Ability', async () => {
    let player = new Player();
    const book1Object = player.addBookToBag({
        name: 'Test Book 1',
        abilities: [
            {
                ability: {
                    name: 'Big Bang',
                    damage: 50
                }
            },
            {
                ability: {
                    name: 'Super Blast',
                    damage: 70
                }
            },
            {
                ability: {
                    name: 'Big hit',
                    damage: 70
                }
            },
            {
                ability: {
                    name: 'Scratch',
                    damage: 70
                }
            }
        ]
    });

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        accounts: {
            player1: player.getData()
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    let playerData = await chatrpg.equipAbility('player1', book1Object.id, 0);
    expect(playerData.abilities[0].name).toMatch(player.datastoreObject.bag.objects[0].content.abilities[0].ability.name);
    
    playerData = await chatrpg.equipAbility('player1', book1Object.id, 1);
    expect(playerData.abilities[1].name).toMatch(player.datastoreObject.bag.objects[0].content.abilities[1].ability.name);

    playerData = await chatrpg.equipAbility('player1', book1Object.id, 2);
    expect(playerData.abilities[2].name).toMatch(player.datastoreObject.bag.objects[0].content.abilities[2].ability.name);

    playerData = await chatrpg.equipAbility('player1', book1Object.id, 3, 'Big Bang');
    expect(playerData.abilities[0].name).toMatch(player.datastoreObject.bag.objects[0].content.abilities[3].ability.name);
    expect(playerData.abilities.length).toBe(3);

    const updatedPlayer = await chatrpg.findPlayerById('player1');
    expect(updatedPlayer.abilities.length).toBe(3);
});

test('Drop Book', async () => {
    let player = new Player();
    player.addBookToBag({
        name: 'Test Book 1',
        abilities: [
            {
                name: 'Scratch',
                damage: 70
            }
        ]
    });

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        accounts: {
            player1: player.getData()
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    let playerData = await chatrpg.dropObjectFromBag('player1', player.getData().bag.objects[0].id);
    expect(playerData.bag.objects.length).toBe(0);
});

test('Drop Item', async () => {
    let player = new Player();
    player.addItemToBag(new Item({
        name: 'Potion',
        count: 3
    }));

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        accounts: {
            player1: player.getData()
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    let playerData = await chatrpg.dropObjectFromBag('player1', player.getData().bag.objects[0].id);
    expect(playerData.bag.objects.length).toBe(0);
});

test('Escape from battle', async () => {
    const dataSource = new MemoryBackedDataSource();
    //Add monsters so that new games can be properly created
    await dataSource.initializeDataSource({
        monsters: {
            eye_sack: {
                monsterNumber: 0,
                strengthRating: 0.2,
                defenseRating: 0.2,
                healthRating: 0.4,
                magicRating: 0.2,
                name: "Eye Sack",
                weapon: new Weapon ({
                    baseDamage: 10,
                    name: "Cornia",
                    type: 'physical',
                    speed: 1,
                    strikeAbility: {
                        baseDamage: 20,
                        name: "X ray"
                    }
                }).getData()
            }
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    let playerId = await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'physical', 'health', 'fr4wt4', 'twitch');
    let gameState = await chatrpg.joinGame(playerId.id, 'new game');
    let battleState = await chatrpg.startBattle(playerId.id, gameState.id, gameState.monsters[0].id);
    let playerOldHealth = battleState.player.health;
    let battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'escape'});
    //TODO check to see if the monster did not make a move before the player escaped
    expect(battleUpdate.result).toBeDefined();
    expect(battleUpdate.result.winner).toBeNull();

    const player = await chatrpg.findPlayerById('fr4wt4', 'twitch');
    expect(player.health).toBeLessThan(playerOldHealth);
});

test('Equip Ability with requirements', async () => {
    let player = new Player();
    const incompleteBookObject = player.addBookToBag({
        name: 'Test Book 1',
        abilities: [
            {
                requirements:[
                    {
                        description: 'Slay 2 monsters with a sword style weapon.',
                        requiredCount: 1,
                        count: 0,
                        tracker: {
                            type: 'weaponStyleVictory',
                            value: 'sword'
                        }
                    }
                ],
                ability: {
                    name: 'Big Bang',
                    damage: 50
                }
            }
        ]
    });

    const completeBookObject = player.addBookToBag({
        name: 'Test Book 2',
        abilities: [
            {
                requirements:[
                    {
                        description: 'Slay 2 monsters with a sword style weapon.',
                        requiredCount: 1,
                        count: 1,
                        tracker: {
                            type: 'weaponStyleVictory',
                            value: 'sword'
                        }
                    }
                ],
                ability: {
                    name: 'Big Bang',
                    damage: 50
                }
            }
        ]
    });

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        accounts: {
            player1: player.getData()
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    await expect(chatrpg.equipAbility('player1', incompleteBookObject.id, 0)).rejects.toThrow(ChatRPGErrors.abilityRequirementNotMet);
    await expect(chatrpg.equipAbility('player1', completeBookObject.id, 0)).resolves;
});

test('Getting a shop', async () => {
    const shopItem = new ShopItem({price: 67, product: {name: 'Test Product'}});
    const shop = new Shop({
        title: 'Test Shop',
        description: 'Testing the shop',
        products: [
            shopItem.getData()
        ]
    });

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        shops: {
            daily: {
                ...shop.getData()
            }
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    const shopData = await chatrpg.getShop('daily');

    expect(shopData).toBeDefined();
    expect(shopData.title).toBe('Test Shop');
    expect(shopData.description).toBe('Testing the shop');
    expect(shopData.products.length).toBe(1);

    const shopItemData = shopData.products[0];

    expect(shopItemData).toBeDefined();
    expect(shopItemData.price).toBe(67);
    expect(shopItemData.product).toBeDefined();
    expect(shopItemData.product.name).toBe('Test Product');

});

test('Buying Items', async () => {
    let player = new Player({coins: 20});
    const shopItem = new ShopItem(
        {
            type: 'item',
            price: 10,
            product: {
                name: 'Test Product',
                count: 1
            }
        });

    const shop = new Shop({
        title: 'Test Shop',
        description: 'Testing the shop'
    });

    shop.addShopItem(shopItem);

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        shops: {
            daily: {
                ...shop.getData()
            }
        },
        accounts: {
            player1: player.getData()
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    player = await chatrpg.buy('player1', 'daily', shop.getData().products[0].id);

    expect(player).toBeDefined();

    player = new Player(player);
    let newItem = player.findObjectInBagByName('Test Product');

    expect(newItem).toBeDefined();
    expect(newItem.content).toBeDefined();
    expect(newItem.content.count).toBe(1);
    expect(player.getData().bag.objects.length).toBe(1);

    player = await chatrpg.buy('player1', 'daily', shop.getData().products[0].id);

    expect(player).toBeDefined();

    player = new Player(player);
    newItem = player.findObjectInBagByName('Test Product');

    expect(newItem).toBeDefined();
    expect(newItem.content).toBeDefined();
    expect(newItem.content.count).toBe(2);

    await expect(chatrpg.buy('player1', 'daily', shop.getData().products[0].id)).rejects.toThrow(ChatRPGErrors.insufficientFunds);
});

test('Buying Weapons', async () => {
    let player = new Player({coins: 20, bag: {capacity: 1, objects: []}});
    const shopItem = new ShopItem(
        {
            type: 'weapon',
            price: 10,
            product: new Weapon({name: 'Test Product'}).getData()
        });

    const shop = new Shop({
        title: 'Test Shop',
        description: 'Testing the shop'
    });

    shop.addShopItem(shopItem);

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        shops: {
            daily: {
                ...shop.getData()
            }
        },
        accounts: {
            player1: player.getData()
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    player = await chatrpg.buy('player1', 'daily', shop.getData().products[0].id);

    expect(player).toBeDefined();

    player = new Player(player);
    let playerData = player.getData();

    expect(playerData.bag.objects.length).toBe(1);
    expect(playerData.bag.objects[0].content.name).toBe('Test Product');

    player = await chatrpg.buy('player1', 'daily', shop.getData().products[0].id);

    expect(player).toBeDefined();

    player = new Player(player);
    playerData = player.getData();

    expect(playerData.bag.objects.length).toBe(1);
    expect(playerData.inventory.leger[0]).toBeDefined();
    expect(playerData.inventory.leger.length).toBe(1);

    const pageData = dataSource.dataSource[Schema.Collections.InventoryPages][playerData.inventory.leger[0].id];

    expect(pageData.objects[0].content).toStrictEqual(shopItem.getData().product);

});

test('Buying Books', async () => {
    let player = new Player({coins: 20});
    const shopItem = new ShopItem(
        {
            type: 'book',
            price: 10,
            product: {
                name: 'Test Product'
            }
        });

    const shop = new Shop({
        title: 'Test Shop',
        description: 'Testing the shop'
    });

    shop.addShopItem(shopItem);

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        shops: {
            daily: {
                ...shop.getData()
            }
        },
        accounts: {
            player1: player.getData()
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    player = await chatrpg.buy('player1', 'daily', shop.getData().products[0].id);

    expect(player).toBeDefined();

    player = new Player(player);
    let newItem = player.findObjectInBagByName('Test Product');

    expect(newItem).toBeDefined();
    expect(newItem.content).toBeDefined();

    player = await chatrpg.buy('player1', 'daily', shop.getData().products[0].id);

    expect(player).toBeDefined();

    player = new Player(player);
    newItem = player.findObjectInBagByName('Test Product');

    expect(newItem).toBeDefined();
    expect(newItem.content).toBeDefined();

    await expect(chatrpg.buy('player1', 'daily', shop.getData().products[0].id)).rejects.toThrow(ChatRPGErrors.insufficientFunds);
});

test('Moving objects from bag to inventory', async () => {
    const player = new Player();
    player.addWeaponToBag(new Weapon({name: 'weapon 1'}));
    player.addWeaponToBag(new Weapon({name: 'weapon 2'}));

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        accounts: {
            player1: player.getData()
        }
    });

    const chatrpg = new ChatRPG(dataSource);

    let playerData = await chatrpg.moveObjectFromBagToInventory('player1', player.getData().bag.objects[0].id);

    expect(playerData).toBeDefined();
    expect(playerData.bag.objects.length).toBe(1);
    expect(playerData.id).toMatch('player1');

    let playerId = playerData.id;
    delete playerData.id;

    expect(playerData).toStrictEqual(dataSource.dataSource[Schema.Collections.Accounts][playerId]);

    playerData = await chatrpg.moveObjectFromBagToInventory('player1', player.getData().bag.objects[1].id);
    
    expect(playerData.bag.objects.length).toBe(0);

    const pageData = dataSource.dataSource[Schema.Collections.InventoryPages][playerData.inventory.leger[0].id].objects;

    let i = 0;
    for(const objectEntry of pageData) {
        expect(objectEntry.content).toStrictEqual(player.getData().bag.objects[i].content);
        i++;
    }
});

test('Moving objects from bag to inventory: Create new page', async () => {
    const player = new Player();
    player.addWeaponToBag(new Weapon({name: 'weapon'}));
    const page = new InventoryPage();
    const page1Id = 'page1';

    for(let i = 0; i < InventoryPage.PAGE_CAPACITY; i++) {
        page.addObjectToInventory({name: `weapon ${i}`}, 'weapon');
        player.onObjectAddedToInventory(page1Id);
    }

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        [Schema.Collections.Accounts]: {
            player1: player.getData()
        },
        [Schema.Collections.InventoryPages]: {
            [page1Id]: page.getData()
        }
    });

    const chatrpg = new ChatRPG(dataSource);

    const playerData = await chatrpg.moveObjectFromBagToInventory('player1', player.getData().bag.objects[0].id);

    let count = 0;
    for(const pageEntry in dataSource.dataSource[Schema.Collections.InventoryPages]) {
        count += 1;
    }

    expect(count).toBe(2)
    expect(playerData).toBeDefined();
    expect(playerData.bag.objects.length).toBe(0);
    expect(playerData.id).toMatch('player1');

    let playerId = playerData.id;
    delete playerData.id;

    expect(playerData).toStrictEqual(dataSource.dataSource[Schema.Collections.Accounts][playerId]);
});

test('Moving objects from inventory to bag', async () => {
    const player = new Player();
    const page = new InventoryPage();
    const inventoryObject = page.addObjectToInventory({name: 'weapon'}, 'weapon');
    const page1Id = 'page1';
    player.onObjectAddedToInventory(page1Id);

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        [Schema.Collections.Accounts]: {
            player1: player.getData()
        },
        [Schema.Collections.InventoryPages]: {
            [page1Id]: page.getData()
        }
    });

    const chatrpg = new ChatRPG(dataSource);

    let {player: playerData, page: pageData} = await chatrpg.moveObjectFromInventoryToBag('player1', page1Id, inventoryObject.id);

    expect(playerData.bag.objects.length).toBe(1);
    expect(pageData.objects.length).toBe(0);
    expect(playerData.bag.objects[0].content).toStrictEqual(inventoryObject.content);
    expect(playerData.inventory.leger[0].count).toBe(0);
});

test('Move to inventory then to bag bug', async () => {
    const player = new Player();
    player.addWeaponToBag(new Weapon({name: 'weapon 1'}));
    const page = new InventoryPage();

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        [Schema.Collections.Accounts]: {
            player1: player.getData()
        }
    });

    const chatrpg = new ChatRPG(dataSource);
    const playerData = await chatrpg.moveObjectFromBagToInventory('player1', player.getData().bag.objects[0].id);
    let pageData = await chatrpg.getInventoryPage('player1', playerData.inventory.leger[0].id);
    const collection = await chatrpg.moveObjectFromInventoryToBag('player1', pageData.id, pageData.objects[0].id);
    pageData = await chatrpg.getInventoryPage('player1', pageData.id);
    expect(pageData).toBeDefined();
});

test('Dropping objects from inventory', async () => {
    const player = new Player();
    const page = new InventoryPage();
    const inventoryObject = page.addObjectToInventory({name: 'weapon'}, 'weapon');
    const page1Id = 'page1';
    player.onObjectAddedToInventory(page1Id);

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        [Schema.Collections.Accounts]: {
            player1: player.getData()
        },
        [Schema.Collections.InventoryPages]: {
            [page1Id]: page.getData()
        }
    });

    const chatrpg = new ChatRPG(dataSource);

    let {player: playerData, page: pageData} = await chatrpg.dropObjectFromInventory('player1', page1Id, inventoryObject.id);

    expect(pageData.objects.length).toBe(0);
    expect(playerData.id).toMatch('player1');
});

test('Claim Object', async () => {
    const player = new Player();
    player.getData().bag.capacity = 1;
    const object1 = player.addObjectToLastDrops({name: 'test object'}, 'book');
    const object2 = player.addObjectToLastDrops({name: 'test object 2'}, 'book');

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        [Schema.Collections.Accounts]: {
            player1: player.getData()
        }
    });

    const chatrpg = new ChatRPG(dataSource);

    let playerData = await chatrpg.claimObject('player1', object1.id);

    expect(playerData).toBeDefined();

    let player1 = new Player(playerData);

    expect(player1.removeLastDrop(object1.id)).toBeFalsy();
    expect(player1.getData().bag.objects[0].content).toStrictEqual(object1.content);

    playerData = await chatrpg.claimObject('player1', object2.id);

    expect(playerData).toBeDefined();

    player1 = new Player(playerData);

    expect(player1.removeLastDrop(object2.id)).toBeFalsy();

    const inventoryPageData = dataSource.dataSource[Schema.Collections.InventoryPages][player1.getNextAvailableInventoryPageId()];

    expect(inventoryPageData).toBeDefined();
    expect(inventoryPageData.objects[0].content).toStrictEqual(object2.content);
});

test('Get Inventory Page', async () => {
    const page = new InventoryPage();
    const object1 = page.addObjectToInventory({name: 'object1'});
    const object2 = page.addObjectToInventory({name: 'object2'});

    const player = new Player();
    player.onObjectAddedToInventory('page1');

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        [Schema.Collections.Accounts]: {
            player1: player.getData()
        },
        [Schema.Collections.InventoryPages]: {
            page1: page.getData()
        }
    });

    const chatrpg = new ChatRPG(dataSource);

    let pageData = await chatrpg.getInventoryPage('player1', 'page1');

    expect(pageData).toBeDefined();
    expect(pageData.objects[0].content).toStrictEqual(object1.content);
    expect(pageData.objects[1].content).toStrictEqual(object2.content);
});
