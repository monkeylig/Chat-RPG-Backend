const chatrpg = require('./chat-rpg');
const MemoryBackedDataSource = require('../data-source/memory-backed-data-source');

test('Testing adding a new Twitch player', async () => {
    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource();

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

    await expect(chatrpg.addNewPlayer(dataSource, 'jhard', 'big-bad.png', twitchId, 'twitch')).resolves.toBeTruthy();

    const userData = dataSource.dataSource["accounts"];

    let playerField;
    for(const field in userData) {
        playerField = field;
        break;
    }

    expect(playerField).toBeTruthy();
    expect(userData[playerField]).toStrictEqual(defaultPlayer);
    // Make sure the same player can't be added twice
    await expect(chatrpg.addNewPlayer(dataSource, 'jhard', 'big-bad.png', twitchId, 'twitch')).rejects.toMatch(chatrpg.Errors.playerExists);
});

test('Testing getting starting avatars', async () => {
    const startingData = {
        avatars: {
            starting_avatars: ['dolfin.png', 'eric.png', 'kris.png', 'jhard.png']
        }
    };

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource(startingData);

    const avatars = await chatrpg.getStartingAvatars(dataSource);

    expect(avatars).toStrictEqual(startingData.avatars.starting_avatars);

});

test('Testing finding a Twitch player', async () => {
    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource();

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

    await chatrpg.addNewPlayer(dataSource, 'jhard', 'big-bad.png', 'fr4wt4', 'twitch');
    await chatrpg.addNewPlayer(dataSource, name, avatar, twitchId, 'twitch');
    await chatrpg.addNewPlayer(dataSource, 'kris', 'super-bad.png', 'sfdz3', 'twitch');

    let player = await chatrpg.findPlayerById(dataSource, twitchId, 'twitch');
    
    expect(player).toStrictEqual(defaultPlayer);

    expect(chatrpg.findPlayerById(dataSource, 'does not exist', 'twitch')).rejects.toMatch(chatrpg.Errors.playerNotFound);
});

test.only('Testing joining a Twitch game', async () => {
    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource();

    await chatrpg.addNewPlayer(dataSource, 'jhard', 'big-bad.png', 'fr4wt4', 'twitch');
    const gameState = await chatrpg.joinGame(dataSource, 'fr4wt4', 'new game', 'twitch');

    expect(gameState.game.gameId).toEqual('new game');
    expect(gameState.player.currentGameId).toEqual('new game');
});