
const MemoryBackedDataSource = require('./memory-backed-data-source');

test('Testing adding a new account', async () => {
    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource();
    const user = {
        name: 'jhard',
        level: 22
    }; 

    await dataSource.addAccount(user);

    const userData = dataSource.dataSource["accounts"];    
    expect(userData[0]).toStrictEqual(user);

});

test('Testing adding multiple accounts', async () => {
    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource();

    const user1 = {
        name: 'jhard',
        level: 22
    };

    const user2 = {
        name: 'ochiva',
        level: 13
    };

    await dataSource.addAccount(user1);
    await dataSource.addAccount(user2);

    const userData = dataSource.dataSource["accounts"];

    expect(userData[0]).toStrictEqual(user1);
    expect(userData[1]).toStrictEqual(user2);
});

test('Testing adding acconts with existing data', async () => {
    let dataSource = new MemoryBackedDataSource();

    const user1 = {
        name: 'jhard',
        level: 22
    };

    const user2 = {
        name: 'ochiva',
        level: 13
    };

    const user3 = {
        name: 'kriskyme',
        level: 13
    };

    const startingData = {
        accounts: [user1, user2]
    };

    await dataSource.initializeDataSource(startingData);

    await dataSource.addAccount(user3);

    const userData = dataSource.dataSource["accounts"];

    expect(userData[2]).toStrictEqual(user3);
});

test('Testing getting avatars with none available', async () => {
    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource();

    const avatars = dataSource.getStartingAvatars();

    expect(avatars).toStrictEqual({});
});

test('Testing getting avatars', async () => {
    
    // Test datasource
    goldAvatars = {
        starting_avatars: ['dolfin.png', 'eric.png', 'kris.png', 'jhard.png']
    }

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource(goldAvatars);

    const avatars = dataSource.getStartingAvatars();

    expect(avatars).toStrictEqual(goldAvatars.starting_avatars);
});