const ChatRPG = require('./chat-rpg');
const MemoryBackedDataSource = require('../data-source/memory-backed-data-source');
const chatRPGUtility = require('./utility');
const Schema = require("./datasource-schema");
const {Player} = require('./datastore-objects/agent');
const seedrandom = require('seedrandom');
const { Shop, ShopItem } = require('./datastore-objects/shop');
const GameModes = require('./game-modes');
const { Weapon, BattleWeapon } = require('./datastore-objects/weapon');
const ChatRPGErrors = require('./errors');
const Item = require('./datastore-objects/item');
const { InventoryPage } = require('./datastore-objects/inventory-page');

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


test('Testing adding a new Twitch player', async () => {
    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource();
    const chatrpg = new ChatRPG(dataSource);

    const name = 'jhard';
    const avatar = 'big-bad.png';
    const twitchId = 'f048932ujr';
    const defaultPlayer = new Player({name, avatar, twitchId});

    defaultPlayer.setStatsAtLevel(1);

    await expect(chatrpg.addNewPlayer(name, avatar, twitchId, 'twitch')).resolves.toBeDefined();

    const userData = dataSource.dataSource["accounts"];

    let playerField;
    for(const field in userData) {
        playerField = field;
        break;
    }

    expect(playerField).toBeTruthy();
    expect(userData[playerField].twitchId).toMatch(defaultPlayer.getData().twitchId);
    expect(userData[playerField].avatar).toMatch(defaultPlayer.getData().avatar);
    expect(userData[playerField].name).toMatch(defaultPlayer.getData().name);

    // Make sure the same player can't be added twice
    await expect(chatrpg.addNewPlayer('jhard', 'big-bad.png', twitchId, 'twitch')).rejects.toThrow(ChatRPGErrors.playerExists);
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
    await dataSource.initializeDataSource();
    const chatrpg = new ChatRPG(dataSource);

    const name = 'ochiva';
    const avatar = 'mid-bad.png';
    const twitchId = 'hdyer';
    const defaultPlayer = new Player({name, avatar, twitchId});

    defaultPlayer.setStatsAtLevel(1);

    await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'fr4wt4', 'twitch');
    await chatrpg.addNewPlayer(name, avatar, twitchId, 'twitch');
    await chatrpg.addNewPlayer('kris', 'super-bad.png', 'sfdz3', 'twitch');

    let player = await chatrpg.findPlayerById(twitchId, 'twitch');
    
    expect(player.id).toBeDefined();
    defaultPlayer.setData('id', player.id);
    expect(player.twitchId).toMatch(defaultPlayer.getData().twitchId);
    expect(player.avatar).toMatch(defaultPlayer.getData().avatar);
    expect(player.name).toMatch(defaultPlayer.getData().name);
    expect(player.bag).toBeDefined();
    expect(player.bag.capacity).toBe(10);

    await expect(chatrpg.findPlayerById('does not exist', 'twitch')).rejects.toThrow(ChatRPGErrors.playerNotFound);
});

test('Testing joining a Twitch game', async () => {
    let dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource();
    let chatrpg = new ChatRPG(dataSource);

    let playerId = await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'fr4wt4', 'twitch');
    let gameState = await chatrpg.joinGame(playerId, 'new game');

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
    
    playerId = await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'gert43', 'twitch');
    let playerId2 = await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'fr4wt4', 'twitch');

    gameState = await chatrpg.joinGame(playerId, 'new game2');
    const oldMonsterCount = gameState.monsters.length;

    expect(gameState.id).toEqual('new game2');
    expect(gameState.monsters.length).toBeGreaterThan(0);
    expect(gameState.monsters[0]).toHaveProperty("strength");
    expect(gameState.monsters[0]).toHaveProperty("defence");

    gameState = await chatrpg.joinGame(playerId2, 'new game2');

    expect(gameState.id).toEqual('new game2');
    expect(gameState.monsters.length).toBe(oldMonsterCount);
    expect(gameState.monsters[0]).toHaveProperty("strength");
    expect(gameState.monsters[0]).toHaveProperty("defence");

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

    let playerId = await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'fr4wt4', 'twitch');
    await chatrpg.joinGame(playerId, 'new game');

    const gameUpdate = await chatrpg.getGame('new game');

    expect(gameUpdate.id).toEqual('new game');
    expect(gameUpdate.monsters.length).toBeGreaterThan(0);
    expect(gameUpdate.monsters[0]).toHaveProperty("strength");
    expect(gameUpdate.monsters[0]).toHaveProperty("defence");
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
    expect(battleState.monster.weaponDropRate).toBe(0.5);
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

    let playerId = await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'fr4wt4', 'twitch');
    let gameState = await chatrpg.joinGame(playerId, 'new game');
    let battleState = await chatrpg.startBattle(playerId, gameState.id, 'No such monster', {monsterClass: 'telemarketer', level: 3});

    expect(battleState).toBeTruthy();
    expect(battleState.player).toBeTruthy();
    expect(battleState.player.id).toMatch(playerId);
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
                defenceRating: 0.2,
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

    let playerId = await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'fr4wt4', 'twitch');
    let gameState = await chatrpg.joinGame(playerId, 'new game');
    let battleState = await chatrpg.startBattle(playerId, gameState.id, gameState.monsters[0].id);
    const playerHealth = battleState.player.health;

    const battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});

    expect(battleUpdate).toBeTruthy();
    expect(battleUpdate.result).toBeUndefined();
    expect(battleUpdate.steps).toBeTruthy();
    expect(battleUpdate.steps.length).toBe(4);

    expect(battleUpdate.steps[0].type).toMatch('info');
    expect(battleUpdate.steps[0].description).toMatch(/strikes/);
    expect(battleUpdate.steps[1].type).toMatch('damage');

    expect(battleUpdate.steps[2].type).toMatch('info');
    expect(battleUpdate.steps[2].description).toMatch(/strikes/);
    expect(battleUpdate.steps[3].type).toMatch('damage');

    const playerLevel = battleUpdate.player.level;
    const playerBaseDamage = battleUpdate.player.weapon.baseDamage;
    const playerStrength = battleUpdate.player.strength;
    const playerDefence = battleUpdate.player.defence;
    const monster = gameState.monsters[0];
    let expectedDamage = Math.floor(((2 * playerLevel / 5 + 2) * playerBaseDamage * playerStrength / monster.defence) / 50 + 2);
    expect(battleUpdate.steps[1].damage).toBe(expectedDamage);
    expectedDamage = Math.floor(((2 * monster.level / 5 + 2) * monster.weapon.baseDamage * monster.strength / playerDefence) / 50 + 2);
    expect(battleUpdate.steps[3].damage).toBe(expectedDamage);
    expect(battleUpdate.player.health).toBe(playerHealth - expectedDamage);
});

test('Battle Actions: Strike Ability', async () => {
    const dataSource = new MemoryBackedDataSource();
    //Add monsters so that new games can be properly created
    await dataSource.initializeDataSource({
        monsters: {
            eye_sack: {
                monsterNumber: 0,
                strengthRating: 0.2,
                defenceRating: 0.2,
                healthRating: 1,
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

    let playerId = await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'fr4wt4', 'twitch');
    let gameState = await chatrpg.joinGame(playerId, 'new game');
    let battleState = await chatrpg.startBattle(playerId, gameState.id, gameState.monsters[0].id);

    let battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});

    expect(battleUpdate.steps[0].description).toMatch(/Heavy Strike/);
    expect(battleUpdate.steps[1].type).toMatch('damage');
});


test('Magic Strike', async () => {
    const dataSource = new MemoryBackedDataSource();
    //Add monsters so that new games can be properly created
    await dataSource.initializeDataSource({
        monsters: {
            eye_sack: {
                monsterNumber: 0,
                strengthRating: 0.2,
                defenceRating: 0.2,
                healthRating: 0.4,
                magicRating: 0.2,
                name: "Eye Sack",
                weapon: new Weapon ({
                    baseDamage: 10,
                    name: "Cornia",
                    type: 'magical',
                    speed: 1,
                    strikeAbility: {
                        baseDamage: 20,
                        name: "X ray"
                    }
                }).getData()
            }
        }
    });
    
    const magicWeapon = new Weapon({
        name: 'Magic Fists',
        baseDamage: 10,
        speed: 3,
        type: 'magical',
        strikeAbility: {
            name: 'Heavy Blast',
            baseDamage: 30,
            modifier: 'magic',
        },
        statGrowth: {
            maxHealth: 2,
            strength: 1,
            magic: 1,
            defence: 1
        }
    }).getData();

    let chatrpg = new ChatRPG(dataSource);

    let playerId = await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'fr4wt4', 'twitch');
    let gameState = await chatrpg.joinGame(playerId, 'new game');

    dataSource.dataSource[Schema.Collections.Accounts][playerId].weapon = magicWeapon;
    dataSource.dataSource[Schema.Collections.Accounts][playerId].strength = 0;
    dataSource.dataSource[Schema.Collections.Accounts][playerId].magic = 10;

    let battleState = await chatrpg.startBattle(playerId, gameState.id, gameState.monsters[0].id);
    let battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});

    expect(battleUpdate.steps[1].type).toMatch('damage');
    expect(battleUpdate.steps[1].damage).toBeGreaterThan(2);

});

test('Battle Actions: Ability', async () => {
    let player = new Player();
    player.datastoreObject.abilities = [
        {
            name: 'Big Bang',
            type: 'magical',
            baseDamage: 50,
            effectName: 'testAbility1'
        }
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
                defenceRating: 0.2,
                healthRating: 40,
                magicRating: 0.2,
                name: "Eye Sack",
                weapon: new Weapon ({
                    baseDamage: 10,
                    name: "Cornia",
                    speed: 1,
                    strikeAbility: {
                        baseDamage: 20,
                        name: "X ray"
                    }
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

    expect(battleObject.environment).toBeDefined();
    expect(battleObject.environment.abilityTest1Activated).toBeTruthy();
    expect(battleUpdate.steps[3].damage).toBeGreaterThan(4);
    expect(battleUpdate.steps[4]).toBeDefined();
    expect(battleUpdate.steps[4].type).toMatch('info');
    expect(battleUpdate.steps[4].description).toMatch('Test ability 1 has activated.');
    expect(battleUpdate.player.ap).toBe(2);
    expect(battleUpdate.steps[5].type).toMatch('apCost');
    expect(battleUpdate.steps[5].apCost).toBe(1);

    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'ability', abilityName: 'Big Bang'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'ability', abilityName: 'Big Bang'});
    await expect(chatrpg.battleAction(battleState.id, {type: 'ability', abilityName: 'Big Bang'})).rejects.toThrow(ChatRPGErrors.notEnoughAp);


});

test('Battle Actions: Item', async () => {
    let player = new Player();
    player.addItemToBag(new Item({
        name: 'Big Bang',
        count: 2,
        effectName: 'testItem1'
    }));
    player.addItemToBag(new Item({
        name: 'Small Bang',
        count: 1,
        effectName: 'testItem2'
    }));

    const dataSource = new MemoryBackedDataSource();
    //Add monsters so that new games can be properly created
    await dataSource.initializeDataSource({
        monsters: {
            eye_sack: {
                monsterNumber: 0,
                strengthRating: 0.2,
                defenceRating: 0.2,
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
        },
        accounts: {
            player1: player.getData()
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    let gameState = await chatrpg.joinGame('player1', 'new game');
    let battleState = await chatrpg.startBattle('player1', gameState.id, gameState.monsters[0].id);

    let battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'item', itemId: player.getData().bag.objects[0].id});


    let battleObject;
    for(const _battle in dataSource.dataSource.battles) {
        battleObject = dataSource.dataSource.battles[_battle];
    }

    expect(battleObject.environment).toBeDefined();
    expect(battleObject.environment.itemTest1Activated).toBeDefined();
    expect(battleUpdate.steps[0].action).toMatch('item');
    expect(battleUpdate.steps[1]).toBeDefined();
    expect(battleUpdate.steps[1].type).toMatch('info');
    expect(battleUpdate.steps[1].description).toMatch('Test item 1 has activated in a battle.');
    expect(battleUpdate.player.bag.objects[0].content.count).toBe(1);

    const itemId = player.getData().bag.objects[1].id;
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'item', itemId: itemId});

    for(const _battle in dataSource.dataSource.battles) {
        battleObject = dataSource.dataSource.battles[_battle];
    }

    expect(battleObject.environment.itemTest2Activated).toBeDefined();
    expect(battleUpdate.steps[1].description).toMatch('Test item 2 has activated in a battle.');
    expect(battleUpdate.player.bag.objects[1]).not.toBeDefined();

    await expect(chatrpg.battleAction(battleState.id, {type: 'item', itemName: itemId})).rejects.toThrow(ChatRPGErrors.itemNotEquipped);

});

test('Defeating a monster', async () => {
    const dataSource = new MemoryBackedDataSource();
    //Add monsters so that new games can be properly created
    await dataSource.initializeDataSource({
        monsters: {
            eye_sack: {
                monsterNumber: 0,
                strengthRating: 0.2,
                defenceRating: 0.2,
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
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    let playerId = await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'fr4wt4', 'twitch');
    let gameState = await chatrpg.joinGame(playerId, 'new game');
    let battleState = await chatrpg.startBattle(playerId, gameState.id, gameState.monsters[0].id);

    let battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});

    expect(battleUpdate.monster.health).toBe(0);
    expect(battleUpdate.result).toBeDefined();
    expect(battleUpdate.result.winner).toMatch(battleState.player.id);
    expect(battleUpdate.result.expAward).toBeDefined();
    expect(battleUpdate.result.expAward).toBe(chatRPGUtility.getMonsterExpGain(battleUpdate.monster));
    expect(battleUpdate.player.level).toBe(2);

    const gameUpdate = await chatrpg.getGame('new game');

    expect(gameUpdate.monsters.includes(battleUpdate.monster.id)).toBeFalsy();
    //#region arena game specific
    expect(gameUpdate.monsters.length).toBe(5);
    //#endregion

    const player = await chatrpg.findPlayerById('fr4wt4', 'twitch');

    expect(player.level).toBe(2);
    expect(player.trackers).toBeDefined();
    expect(player.trackers.weaponKills).toBeDefined();
    expect(player.trackers.weaponKills.melee).toBe(1);

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
                defenceRating: 0.2,
                healthRating: 2,
                magicRating: 0.2,
                expYield: 36,
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

    let playerId = await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'fr4wt4', 'twitch');
    let gameState = await chatrpg.joinGame(playerId, 'new game');
    let battleState = await chatrpg.startBattle(playerId, gameState.id, gameState.monsters[0].id);

    let battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});

    expect(battleUpdate.player.health).toBe(0);
    expect(battleUpdate.result).toBeDefined();
    expect(battleUpdate.result.winner).toMatch(battleState.monster.id);

    const player = await chatrpg.findPlayerById(playerId);

    expect(player.health).toBe(Math.floor(player.maxHealth * 0.75));
    expect(player.trackers.deaths).toBe(1);
});

test('Player being revived', async () => {
    let player = new Player({reviveReady: true});
    const dataSource = new MemoryBackedDataSource();
    //Add monsters so that new games can be properly created
    await dataSource.initializeDataSource({
        monsters: {
            eye_sack: {
                monsterNumber: 0,
                strengthRating: 0.2,
                defenceRating: 0.2,
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
    expect(battleUpdate.player.reviveReady).toBe(false);

    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});

    expect(battleUpdate.result).toBeDefined();

    const playerData = await chatrpg.findPlayerById('player1');

    expect(playerData.reviveReady).toBe(false);

});

test('Monster Drops', async () => {
    chatRPGUtility.random = seedrandom('3');
    let playerId = 'pid';
    const dataSource = new MemoryBackedDataSource();
    //Add monsters so that new games can be properly created
    await dataSource.initializeDataSource({
        monsters: {
            eye_sack: {
                monsterNumber: 0,
                strengthRating: 0.2,
                defenceRating: 0.2,
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
            [playerId]: new Player().getData()
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    let gameState = await chatrpg.joinGame(playerId, 'new game');
    let battleState = await chatrpg.startBattle(playerId, gameState.id, gameState.monsters[0].id);

    let battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});

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
                    defenceRating: 0.2,
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
    chatRPGUtility.random = seedrandom('3');
    const defaultPlayer = new Player({name: 'jhard', avatar: 'big-bad.png', twitchId: 'fr4wt4'});
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
                defenceRating: 0.2,
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
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    let gameState = await chatrpg.joinGame('testPlayer', 'new game');
    let battleState = await chatrpg.startBattle('testPlayer', gameState.id, gameState.monsters[0].id);

    let battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});

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
                defenceRating: 0.2,
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
    player.datastoreObject.bag.books = [
        {
            name: 'Test Book 1',
            abilities: [
                {
                    weaponKillRequirements: {
                        sword: 0
                    },
                    ability: {
                        name: 'Big Bang',
                        damage: 50
                    }
                },
                {
                    weaponKillRequirements: {
                        sword: 0
                    },
                    ability: {
                        name: 'Super Blast',
                        damage: 70
                    }
                },
                {
                    weaponKillRequirements: {
                        sword: 0
                    },
                    ability: {
                        name: 'Big hit',
                        damage: 70
                    }
                },
                {
                    weaponKillRequirements: {
                        sword: 0
                    },
                    ability: {
                        name: 'Scratch',
                        damage: 70
                    }
                }
            ]
        }
    ];

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        accounts: {
            player1: player.getData()
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    let playerData = await chatrpg.equipAbility('player1', 'Test Book 1', 0);
    expect(playerData.abilities[0].name).toMatch(player.datastoreObject.bag.books[0].abilities[0].ability.name);
    
    playerData = await chatrpg.equipAbility('player1', 'Test Book 1', 1);
    expect(playerData.abilities[1].name).toMatch(player.datastoreObject.bag.books[0].abilities[1].ability.name);

    playerData = await chatrpg.equipAbility('player1', 'Test Book 1', 2);
    expect(playerData.abilities[2].name).toMatch(player.datastoreObject.bag.books[0].abilities[2].ability.name);

    playerData = await chatrpg.equipAbility('player1', 'Test Book 1', 3, 'Big Bang');
    expect(playerData.abilities[0].name).toMatch(player.datastoreObject.bag.books[0].abilities[3].ability.name);
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
                defenceRating: 0.2,
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

    let playerId = await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'fr4wt4', 'twitch');
    let gameState = await chatrpg.joinGame(playerId, 'new game');
    let battleState = await chatrpg.startBattle(playerId, gameState.id, gameState.monsters[0].id);
    let playerOldHealth = battleState.player.health;
    let battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'escape'});
    expect(battleUpdate.result).toBeDefined();
    expect(battleUpdate.result.winner).toBeNull();

    const player = await chatrpg.findPlayerById('fr4wt4', 'twitch');
    expect(player.health).toBeLessThan(playerOldHealth);
});

test('Equip Ability with requirements', async () => {
    let player = new Player();
    player.datastoreObject.bag.books = [
        {
            name: 'Test Book 1',
            abilities: [
                {
                    weaponKillRequirements: {
                        sword: 1
                    },
                    ability: {
                        name: 'Big Bang',
                        damage: 50
                    }
                }
            ]
        }
    ];

    let player2 = new Player();
    player2.datastoreObject.trackers.weaponKills.sword = 1;
    player2.datastoreObject.bag.books = [
        {
            name: 'Test Book 1',
            abilities: [
                {
                    weaponKillRequirements: {
                        sword: 1
                    },
                    ability: {
                        name: 'Big Bang',
                        damage: 50
                    }
                }
            ]
        }
    ];

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        accounts: {
            player1: player.getData(),
            player2: player2.getData()
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    await expect(chatrpg.equipAbility('player1', 'Test Book 1', 0)).rejects.toThrow(ChatRPGErrors.abilityRequirementNotMet);
    await expect(chatrpg.equipAbility('player2', 'Test Book 1', 0)).resolves;
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

    player = await chatrpg.buy('player1', 'daily', shop.getData().products[0].id);

    expect(player).toBeDefined();

    player = new Player(player);
    newItem = player.findObjectInBagByName('Test Product');

    expect(newItem).toBeDefined();
    expect(newItem.content).toBeDefined();
    expect(newItem.content.count).toBe(2);

    await expect(chatrpg.buy('player1', 'daily', shop.getData().products[0].id)).rejects.toThrow(ChatRPGErrors.insufficientFunds);
});

test.only('Buying Weapons', async () => {
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
});

test('Dropping objects from inventory to bag', async () => {
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

