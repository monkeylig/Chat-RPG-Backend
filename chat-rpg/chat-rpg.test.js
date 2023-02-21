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
            starting_avatars: ['dolfin.png', 'eric.png', 'kris.png', 'jhard.png']
        }
    };

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource(startingData);
    const chatrpg = new ChatRPG(dataSource);

    const avatars = await chatrpg.getStartingAvatars();

    expect(avatars).toStrictEqual(startingData.avatars.starting_avatars);

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

    expect(chatrpg.findPlayerById('does not exist', 'twitch')).rejects.toMatch(ChatRPG.Errors.playerNotFound);
});

test('Testing joining a Twitch game', async () => {
    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource();
    const chatrpg = new ChatRPG(dataSource);

    await chatrpg.addNewPlayer('jhard', 'big-bad.png', 'fr4wt4', 'twitch');
    const gameState = await chatrpg.joinGame('fr4wt4', 'new game', 'twitch');

    expect(gameState.gameId).toEqual('new game');
});