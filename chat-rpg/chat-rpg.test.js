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
        twichId: twitchId,
        level: 1,
        attack: 1,
        magic_attack: 1,
        defence: 1,
        health: 10
    };

    await expect(chatrpg.addNewPlayer(dataSource, 'jhard', 'big-bad.png', twitchId)).resolves.toBe(true);

    const userData = dataSource.dataSource["accounts"];    
    expect(userData[0]).toStrictEqual(defaultPlayer);
});

test('Testing getting starting avatars', async () => {
    const startingData = {
        starting_avatars: ['dolfin.png', 'eric.png', 'kris.png', 'jhard.png']
    };

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource(startingData);

    const avatars = chatrpg.getStartingAvatars(dataSource);

    expect(avatars).toStrictEqual(startingData.starting_avatars);

});