const ChatRPG = require('./chat-rpg');
const MemoryBackedDataSource = require('../data-source/memory-backed-data-source');



test('Testing adding a new Twitch player', async () => {
    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource();
    const chatrpg = new ChatRPG(dataSource);

    const name = 'jhard';
    const avatar = 'big-bad.png';
    const twitchId = 'f048932ujr';
    const defaultPlayer = {
        name: name,
        avatar: avatar,
        twitchId: twitchId,
        level: 1,
        attack: 1,
        magic_attack: 1,
        defence: 1,
        health: 10
    };

    await expect(chatrpg.addNewPlayer('jhard', 'big-bad.png', twitchId, 'twitch')).resolves.toBeTruthy();

    const userData = dataSource.dataSource["accounts"];

    let playerField;
    for(const field in userData) {
        playerField = field;
        break;
    }

    expect(playerField).toBeTruthy();
    expect(userData[playerField]).toStrictEqual(defaultPlayer);

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
    const defaultPlayer = {
        name: name,
        avatar: avatar,
        twitchId: twitchId,
        level: 1,
        attack: 1,
        magic_attack: 1,
        defence: 1,
        health: 10
    };

    await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'fr4wt4', 'twitch');
    await chatrpg.addNewPlayer(name, avatar, twitchId, 'twitch');
    await chatrpg.addNewPlayer('kris', 'super-bad.png', 'sfdz3', 'twitch');

    let player = await chatrpg.findPlayerById(twitchId, 'twitch');
    
    expect(player).toStrictEqual(defaultPlayer);

    await expect(chatrpg.findPlayerById('does not exist', 'twitch')).rejects.toThrow(ChatRPG.Errors.playerNotFound);
});

test('Testing joining a Twitch game', async () => {
    let dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource();
    let chatrpg = new ChatRPG(dataSource);

    let playerId = await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'fr4wt4', 'twitch');
    let gameState = await chatrpg.joinGame(playerId, 'new game');

    expect(gameState.gameId).toEqual('new game');
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

    expect(gameState.gameId).toEqual('new game2');
    expect(gameState.monsters.length).toBeGreaterThan(0);
    expect(gameState.monsters[0]).toHaveProperty("attack");
    expect(gameState.monsters[0]).toHaveProperty("defence");

    gameState = await chatrpg.joinGame(playerId2, 'new game2');

    expect(gameState.gameId).toEqual('new game2');
    expect(gameState.monsters.length).toBe(oldMonsterCount);
    expect(gameState.monsters[0]).toHaveProperty("attack");
    expect(gameState.monsters[0]).toHaveProperty("defence");

    players = dataSource.dataSource.accounts;

    for(player in players) {
        expect(players[player].currentGameId).toBe('new game2');
    }
});

test('Starting a battle', async () => {
    const dataSource = new MemoryBackedDataSource();
    //Add monsters so that new games can be properly created
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
    let gameState = await chatrpg.joinGame(playerId, 'new game');
    let battleState = await chatrpg.startBattle(playerId, gameState.gameId, gameState.monsters[0].id);

    expect(battleState).toBeTruthy();
});