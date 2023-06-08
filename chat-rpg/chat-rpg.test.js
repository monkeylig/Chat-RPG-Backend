const ChatRPG = require('./chat-rpg');
const MemoryBackedDataSource = require('../data-source/memory-backed-data-source');
const chatRPGUtility = require('./utility');
const Schema = require("./datasource-schema");
const {Player} = require('./datastore-objects/agent');
const seedrandom = require('seedrandom');



test('Testing adding a new Twitch player', async () => {
    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource();
    const chatrpg = new ChatRPG(dataSource);

    const name = 'jhard';
    const avatar = 'big-bad.png';
    const twitchId = 'f048932ujr';
    const defaultPlayer = new Player({name, avatar, twitchId});

    defaultPlayer.setStatsAtLevel(1);

    await expect(chatrpg.addNewPlayer(name, avatar, twitchId, 'twitch')).resolves.toBeTruthy();

    const userData = dataSource.dataSource["accounts"];

    let playerField;
    for(const field in userData) {
        playerField = field;
        break;
    }

    expect(playerField).toBeTruthy();
    expect(userData[playerField]).toStrictEqual(defaultPlayer.getData());

    // Make sure the same player can't be added twice
    await expect(chatrpg.addNewPlayer('jhard', 'big-bad.png', twitchId, 'twitch')).rejects.toThrow(ChatRPG.Errors.playerExists);
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
    expect(player).toStrictEqual(defaultPlayer.datastoreObject);

    await expect(chatrpg.findPlayerById('does not exist', 'twitch')).rejects.toThrow(ChatRPG.Errors.playerNotFound);
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
                attackRating: 0.5
            },

            eye_sack: {
                monsterNumber: 1,
                attackRating: 0.2
            },

            telemarketer: {
                monsterNumber: 2,
                attackRating: 0.7
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
    expect(gameState.monsters[0]).toHaveProperty("attack");
    expect(gameState.monsters[0]).toHaveProperty("defence");

    gameState = await chatrpg.joinGame(playerId2, 'new game2');

    expect(gameState.id).toEqual('new game2');
    expect(gameState.monsters.length).toBe(oldMonsterCount);
    expect(gameState.monsters[0]).toHaveProperty("attack");
    expect(gameState.monsters[0]).toHaveProperty("defence");

    players = dataSource.dataSource.accounts;

    for(player in players) {
        expect(players[player].currentGameId).toBe('new game2');
    }

    const gameData = (await dataSource.collection(Schema.Collections.Games).doc('new game2').get()).data();
    expect(typeof gameData.monsters[0]).toMatch('string');
});

test('Getting a game update', async () => {
    let dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        monsters: {
            skellington: {
                monsterNumber: 0,
                attackRating: 0.5
            },

            eye_sack: {
                monsterNumber: 1,
                attackRating: 0.2
            },

            telemarketer: {
                monsterNumber: 2,
                attackRating: 0.7
            }
        }
    });
    let chatrpg = new ChatRPG(dataSource);

    let playerId = await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'fr4wt4', 'twitch');
    await chatrpg.joinGame(playerId, 'new game');

    const gameUpdate = await chatrpg.getGame('new game');

    expect(gameUpdate.id).toEqual('new game');
    expect(gameUpdate.monsters.length).toBeGreaterThan(0);
    expect(gameUpdate.monsters[0]).toHaveProperty("attack");
    expect(gameUpdate.monsters[0]).toHaveProperty("defence");

    const gameData = (await dataSource.collection(Schema.Collections.Games).doc('new game').get()).data();
    expect(typeof gameData.monsters[0]).toMatch('string');
});

test('Starting a battle', async () => {
    const dataSource = new MemoryBackedDataSource();
    //Add monsters so that new games can be properly created
    await dataSource.initializeDataSource({
        monsters: {
            skellington: {
                monsterNumber: 0,
                healthRating: 0.5,
                attackRating: 0.5
            },

            eye_sack: {
                monsterNumber: 1,
                healthRating: 0.5,
                attackRating: 0.2
            },

            telemarketer: {
                monsterNumber: 2,
                healthRating: 0.5,
                attackRating: 0.7
            }
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    let playerId = await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'fr4wt4', 'twitch');
    let gameState = await chatrpg.joinGame(playerId, 'new game');
    let battleState = await chatrpg.startBattle(playerId, gameState.id, gameState.monsters[0].id);

    expect(battleState).toBeTruthy();
    expect(battleState.player).toBeTruthy();
    expect(battleState.player.id).toMatch(playerId);
    expect(battleState.monster).toBeTruthy();
    expect(battleState.gameId).toBe('new game');
    expect(battleState.monster.id).toBe(gameState.monsters[0].id);
    expect(battleState.monster.id).not.toBe(gameState.monsters[1].id);
    expect(battleState.monster.weaponDropRate).toBe(0.5);
    expect(battleState.monster.health).toBeTruthy();
    expect(battleState.monster.maxHealth).toBeTruthy();
});

test('Battle Actions: Strike', async () => {
    const dataSource = new MemoryBackedDataSource();
    //Add monsters so that new games can be properly created
    await dataSource.initializeDataSource({
        monsters: {
            eye_sack: {
                monsterNumber: 0,
                attackRating: 0.2,
                defenceRating: 0.2,
                healthRating: 0.4,
                magicRating: 0.2,
                name: "Eye Sack",
                weapon: {
                    baseDamage: 10,
                    name: "Cornia",
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

    let playerId = await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'fr4wt4', 'twitch');
    let gameState = await chatrpg.joinGame(playerId, 'new game');
    let battleState = await chatrpg.startBattle(playerId, gameState.id, gameState.monsters[0].id);
    const playerHealth = battleState.player.health;

    const battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});

    expect(battleUpdate).toBeTruthy();
    expect(battleUpdate.steps).toBeTruthy();
    expect(battleUpdate.steps.length).toBe(4);

    expect(battleUpdate.steps[0].type).toMatch('info');
    expect(battleUpdate.steps[0].description).toMatch(/strikes/);
    expect(battleUpdate.steps[1].type).toMatch('damage');
    expect(battleUpdate.steps[1].actorId).toMatch(playerId);

    expect(battleUpdate.steps[2].type).toMatch('info');
    expect(battleUpdate.steps[2].description).toMatch(/strikes/);
    expect(battleUpdate.steps[3].type).toMatch('damage');
    expect(battleUpdate.steps[3].actorId).toMatch(gameState.monsters[0].id);

    const playerLevel = battleUpdate.player.level;
    const playerBaseDamage = battleUpdate.player.weapon.baseDamage;
    const playerAttack = battleUpdate.player.attack;
    const playerDefence = battleUpdate.player.defence;
    const monster = gameState.monsters[0];
    let expectedDamage = Math.floor(((2 * playerLevel / 5 + 2) * playerBaseDamage * playerAttack / monster.defence) / 50 + 2);
    expect(battleUpdate.steps[1].damage).toBe(expectedDamage);
    expectedDamage = Math.floor(((2 * monster.level / 5 + 2) * monster.weapon.baseDamage * monster.attack / playerDefence) / 50 + 2);
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
                attackRating: 0.2,
                defenceRating: 0.2,
                healthRating: 1,
                magicRating: 0.2,
                name: "Eye Sack",
                weapon: {
                    baseDamage: 10,
                    name: "Cornia",
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
                attackRating: 0.2,
                defenceRating: 0.2,
                healthRating: 0.4,
                magicRating: 0.2,
                name: "Eye Sack",
                weapon: {
                    baseDamage: 10,
                    name: "Cornia",
                    speed: 1,
                    strikeAbility: {
                        baseDamage: 20,
                        name: "X ray"
                    }
                }
            }
        }
    });
    
    const magicWeapon = {
        name: 'Magic Fists',
        baseDamage: 10,
        speed: 3,
        modifier: 'magic',
        strikeAbility: {
            name: 'Heavy Blast',
            baseDamage: 30,
            modifier: 'magic',
        },
        statGrowth: {
            maxHealth: 2,
            attack: 1,
            magic: 1,
            defence: 1
        }
    };

    let chatrpg = new ChatRPG(dataSource);

    let playerId = await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'fr4wt4', 'twitch');
    let gameState = await chatrpg.joinGame(playerId, 'new game');

    dataSource.dataSource[Schema.Collections.Accounts][playerId].weapon = magicWeapon;
    dataSource.dataSource[Schema.Collections.Accounts][playerId].attack = 0;
    dataSource.dataSource[Schema.Collections.Accounts][playerId].magic = 10;

    let battleState = await chatrpg.startBattle(playerId, gameState.id, gameState.monsters[0].id);
    let battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});

    expect(battleUpdate.steps[1].type).toMatch('damage');
    expect(battleUpdate.steps[1].damage).toBeGreaterThan(2);

});

test('Defeating a monster', async () => {
    const dataSource = new MemoryBackedDataSource();
    //Add monsters so that new games can be properly created
    await dataSource.initializeDataSource({
        monsters: {
            eye_sack: {
                monsterNumber: 0,
                attackRating: 0.2,
                defenceRating: 0.2,
                healthRating: 0.1,
                magicRating: 0.2,
                expYield: 36,
                name: "Eye Sack",
                weapon: {
                    baseDamage: 10,
                    name: "Cornia",
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

    let playerId = await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'fr4wt4', 'twitch');
    let gameState = await chatrpg.joinGame(playerId, 'new game');
    let battleState = await chatrpg.startBattle(playerId, gameState.id, gameState.monsters[0].id);

    let battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});

    expect(battleUpdate.monster.health).toBe(0);
    expect(battleUpdate.result).toBeTruthy();
    expect(battleUpdate.result.winner).toMatch(battleState.player.id);
    expect(battleUpdate.result.expAward).toBeTruthy();
    expect(battleUpdate.result.expAward).toBe(chatRPGUtility.getMonsterExpGain(battleUpdate.monster));
    expect(battleUpdate.player.level).toBe(2);

    const gameUpdate = await chatrpg.getGame('new game');

    expect(gameUpdate.monsters.includes(battleUpdate.monster.id)).toBeFalsy();

    const player = await chatrpg.findPlayerById('fr4wt4', 'twitch');

    expect(player.level).toBe(2);

    await expect(chatrpg.battleAction(battleState.id, {type: 'strike'})).rejects.toThrow(ChatRPG.Errors.battleNotFound);

});

test('Player being defeated', async () => {
    const dataSource = new MemoryBackedDataSource();
    //Add monsters so that new games can be properly created
    await dataSource.initializeDataSource({
        monsters: {
            eye_sack: {
                monsterNumber: 0,
                attackRating: 0.2,
                defenceRating: 0.2,
                healthRating: 2,
                magicRating: 0.2,
                expYield: 36,
                name: "Eye Sack",
                weapon: {
                    baseDamage: 10,
                    name: "Cornia",
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

    let playerId = await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'fr4wt4', 'twitch');
    let gameState = await chatrpg.joinGame(playerId, 'new game');
    let battleState = await chatrpg.startBattle(playerId, gameState.id, gameState.monsters[0].id);

    let battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});

    expect(battleUpdate.player.health).toBe(0);
    expect(battleUpdate.result).toBeTruthy();
    expect(battleUpdate.result.winner).toMatch(battleState.monster.id);
});

test('Monster Drops', async () => {
    chatRPGUtility.random = seedrandom('Welcome!');

    const dataSource = new MemoryBackedDataSource();
    //Add monsters so that new games can be properly created
    await dataSource.initializeDataSource({
        monsters: {
            eye_sack: {
                monsterNumber: 0,
                attackRating: 0.2,
                defenceRating: 0.2,
                healthRating: 0.1,
                magicRating: 0.2,
                expYield: 36,
                name: "Eye Sack",
                weapon: {
                    baseDamage: 10,
                    name: "Cornia",
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

    let playerId = await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'fr4wt4', 'twitch');
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

    const player = await chatrpg.findPlayerById('fr4wt4', 'twitch');

    expect(player.bag.weapons.length).toBeGreaterThan(0);
    expect(player.bag.weapons[0].name).toMatch(battleUpdate.monster.weapon.name);

    const playerData = (await dataSource.collection(Schema.Collections.Accounts).doc(playerId).get()).data();
    expect(typeof playerData.bag.weapons[0]).toMatch('string');
});

test('Monster Drops with bag full', async () => {
    chatRPGUtility.random = seedrandom('Welcome!');
    const defaultPlayer = new Player({name: 'jhard', avatar: 'big-bad.png', twitchId: 'fr4wt4'});
    const fillerWeapon = {
        baseDamage: 10,
        name: "bat",
        speed: 1,
        strikeAbility: {
            baseDamage: 20,
            name: "swing"
        }
    };

    while(defaultPlayer.addWeapon(fillerWeapon)){}

    const dataSource = new MemoryBackedDataSource();
    //Add monsters so that new games can be properly created
    await dataSource.initializeDataSource({
        [Schema.Collections.Accounts]: {
            testPlayer: defaultPlayer.getData()
        }, 
        monsters: {
            eye_sack: {
                monsterNumber: 0,
                attackRating: 0.2,
                defenceRating: 0.2,
                healthRating: 0.1,
                magicRating: 0.2,
                expYield: 36,
                name: "Eye Sack",
                weapon: {
                    baseDamage: 10,
                    name: "Cornia",
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

    let gameState = await chatrpg.joinGame('testPlayer', 'new game');
    let battleState = await chatrpg.startBattle('testPlayer', gameState.id, gameState.monsters[0].id);

    let battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});

    const player = await chatrpg.findPlayerById('fr4wt4', 'twitch');
    expect(player.lastDrops.weapons.length).toBeGreaterThan(0);
    expect(player.lastDrops.weapons[0].name).toMatch(battleUpdate.monster.weapon.name);

    const playerData = (await dataSource.collection(Schema.Collections.Accounts).doc('testPlayer').get()).data();
    expect(typeof playerData.lastDrops.weapons[0]).toMatch('string');
});

test('Monster does not drop weapon', async () => {
    chatRPGUtility.random = seedrandom('Chat RPG!');

    const dataSource = new MemoryBackedDataSource();
    //Add monsters so that new games can be properly created
    await dataSource.initializeDataSource({
        monsters: {
            eye_sack: {
                monsterNumber: 0,
                attackRating: 0.2,
                defenceRating: 0.2,
                healthRating: 0.1,
                magicRating: 0.2,
                expYield: 36,
                name: "Eye Sack",
                weapon: {
                    baseDamage: 10,
                    name: "Cornia",
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

    let playerId = await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'fr4wt4', 'twitch');
    let gameState = await chatrpg.joinGame(playerId, 'new game');
    let battleState = await chatrpg.startBattle(playerId, gameState.id, gameState.monsters[0].id);

    let battleUpdate;
    do {
        battleUpdate = await chatrpg.battleAction(battleState.id, {type: 'strike'});
    } while(!battleUpdate.result)

    const player = await chatrpg.findPlayerById('fr4wt4', 'twitch');
    expect(player.bag.weapons.length).toBe(0);
    expect(player.lastDrops.weapons.length).toBe(0);

    for(const drop of battleUpdate.result.drops) {
        expect(drop.type).not.toMatch('weapon');
    }
});

test('Equip weapon', async () => {
    let player = new Player();
    player.addWeapon({name: 'sword'});
    const weaponId = player.datastoreObject.bag.weapons[0].id;
    
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
    player.addWeapon({name: 'sword'});
    player.addWeapon({name: 'sword2'});
    const weaponId = player.datastoreObject.bag.weapons[0].id;

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        accounts: {
            player1: player.getData()
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    let playerData = await chatrpg.dropWeapon('player1', weaponId);

    expect(playerData.bag.weapons.length).toBe(1);
    expect(playerData.bag.weapons[0].name).toMatch('sword2');
});

test('Player drop weapon while equipped', async () => {
    let player = new Player();
    const weapon = {name: 'sword', id: 'weapon1'};
    player.addWeapon(weapon);
    const weaponId = player.datastoreObject.bag.weapons[0].id;

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        accounts: {
            player1: player.getData()
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    let playerData = await chatrpg.dropWeapon('player1', weaponId);

    expect(playerData.bag.weapons.length).toBe(0);
    expect(playerData.weapon.name).toMatch(chatRPGUtility.defaultWeapon.name);
});

test('Equip Ability', async () => {
    let player = new Player();
    player.datastoreObject.bag.books = [
        {
            name: 'Test Book 1',
            abilities: [
                {
                    name: 'Big Bang',
                    damage: 50
                },
                {
                    name: 'Super Blast',
                    damage: 70
                },
                {
                    name: 'Big hit',
                    damage: 70
                },
                {
                    name: 'Scratch',
                    damage: 70
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
    expect(playerData.abilities[0]).toStrictEqual(player.datastoreObject.bag.books[0].abilities[0]);
    
    playerData = await chatrpg.equipAbility('player1', 'Test Book 1', 1);
    expect(playerData.abilities[1]).toStrictEqual(player.datastoreObject.bag.books[0].abilities[1]);

    playerData = await chatrpg.equipAbility('player1', 'Test Book 1', 2);
    expect(playerData.abilities[2]).toStrictEqual(player.datastoreObject.bag.books[0].abilities[2]);

    playerData = await chatrpg.equipAbility('player1', 'Test Book 1', 3, 'Big Bang');
    expect(playerData.abilities[0]).toStrictEqual(player.datastoreObject.bag.books[0].abilities[3]);
});

test('Drop Book', async () => {
    let player = new Player();
    player.datastoreObject.bag.books = [
        {
            name: 'Test Book 1',
            abilities: [
                {
                    name: 'Scratch',
                    damage: 70
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

    let playerData = await chatrpg.dropBook('player1', 'Test Book 1');
    expect(playerData.bag.books.length).toBe(0);
});

test('Drop Item', async () => {
    let player = new Player();
    player.datastoreObject.bag.items = [
        {
            name: 'Potion',
            count: 3
        }
    ];

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        accounts: {
            player1: player.getData()
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    let playerData = await chatrpg.dropItem('player1', 'Potion');
    expect(playerData.bag.items.length).toBe(0);
});

test('Escape from battle', async () => {
    const dataSource = new MemoryBackedDataSource();
    //Add monsters so that new games can be properly created
    await dataSource.initializeDataSource({
        monsters: {
            eye_sack: {
                monsterNumber: 0,
                attackRating: 0.2,
                defenceRating: 0.2,
                healthRating: 0.4,
                magicRating: 0.2,
                name: "Eye Sack",
                weapon: {
                    baseDamage: 10,
                    name: "Cornia",
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