const chatrpg = require('./chat-rpg');
const MemoryBackedDataSource = require('../data-source/memory-backed-data-source');

test('Testing adding a new player', async () => {
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

    await expect(chatrpg.addNewPlayer(dataSource, 'jhard', 'big-bad.png', twitchId)).resolves.toBeTruthy();

    const userData = dataSource.dataSource["accounts"];
    defaultPlayer._id = userData[0]._id;
    expect(userData[0]).toStrictEqual(defaultPlayer);

    // Make sure the same player can't be added twice
    await expect(chatrpg.addNewPlayer(dataSource, 'jhard', 'big-bad.png', twitchId)).resolves.toBeFalsy();

    expect(userData.length).toEqual(1);
});

test('Testing getting starting avatars', async () => {
    const startingData = {
        starting_avatars: ['dolfin.png', 'eric.png', 'kris.png', 'jhard.png']
    };

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource(startingData);

    const avatars = await chatrpg.getStartingAvatars(dataSource);

    expect(avatars).toStrictEqual(startingData.starting_avatars);

});

test('Testing finding a player', async () => {
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

    await chatrpg.addNewPlayer(dataSource, 'jhard', 'big-bad.png', 'fr4wt4');
    await chatrpg.addNewPlayer(dataSource, name, avatar, twitchId);
    await chatrpg.addNewPlayer(dataSource, 'kris', 'super-bad.png', 'sfdz3');

    let player = await chatrpg.findPlayerByTwitchId(dataSource, twitchId);
    
    defaultPlayer._id = player._id;
    expect(player).toStrictEqual(defaultPlayer);

    player = await chatrpg.findPlayerByTwitchId(dataSource, 'does not exist');

    expect(player).toStrictEqual({});
});