
const MemoryBackedDataSource = require('./memory-backed-data-source');

test('Test initialization with initial data', async () => {
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
        accounts: [user1, user2, user3]
    };

    await dataSource.initializeDataSource(startingData);

    const userData = dataSource.dataSource.accounts;
    
    expect(userData[0]).toStrictEqual(user1);
    expect(userData[1]).toStrictEqual(user2);
    expect(userData[2]).toStrictEqual(user3);
});

test('Testing adding a new account (legacy)', async () => {
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

test('Testing adding multiple accounts (legacy)', async () => {
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

test('Testing adding accounts with existing data (legacy)', async () => {
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

test('Testing getting avatars with none available (legacy)', async () => {
    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource();

    const avatars = await dataSource.getStartingAvatars();

    expect(avatars).toStrictEqual({});
});

test('Testing getting avatars (legacy)', async () => {
    
    // Test datasource
    goldAvatars = {
        starting_avatars: ['dolfin.png', 'eric.png', 'kris.png', 'jhard.png']
    }

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource(goldAvatars);

    const avatars = await dataSource.getStartingAvatars();

    expect(avatars).toStrictEqual(goldAvatars.starting_avatars);
});

test('Testing adding a new document to collection', async () => {
    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource();
    const user = {
        name: 'jhard',
        level: 22
    }; 

    let newUser = await dataSource.addDocumentToCollection(user, 'accounts');

    expect(newUser).toStrictEqual(user);

});

test('Testing adding multiple documents to collection', async () => {
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

    const newUser1 = await dataSource.addDocumentToCollection(user1, 'accounts');
    const newUser2 = await dataSource.addDocumentToCollection(user2, 'accounts');

    expect(newUser1).toStrictEqual(user1);
    expect(newUser2).toStrictEqual(user2);
});

test('Testing adding documents with existing data', async () => {
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

    const newUser = await dataSource.addDocumentToCollection(user3, 'accounts');

    expect(newUser).toStrictEqual(user3);
});

test('Testing getting empty collection', async () => {
    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource();

    const avatars = await dataSource.getCollection('starting_avatars');

    expect(avatars).toStrictEqual([]);
});

test('Testing getting populated collection', async () => {
    
    // Test datasource
    goldAvatars = {
        starting_avatars: ['dolfin.png', 'eric.png', 'kris.png', 'jhard.png']
    }

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource(goldAvatars);

    const avatars = await dataSource.getCollection('starting_avatars');

    expect(avatars).toStrictEqual(goldAvatars.starting_avatars);
});

test('Testing finding document in collection', async () => {
    let dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource();

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

    await dataSource.addDocumentToCollection(user1, 'accounts');
    await dataSource.addDocumentToCollection(user2, 'accounts');
    await dataSource.addDocumentToCollection(user3, 'accounts');

    const targetData = await dataSource.findDocumentInCollection('ochiva', 'name', 'accounts');

    expect(targetData).toStrictEqual(user2);
});

test('Testing failing to find document in collection', async () => {
    let dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource();

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

    await dataSource.addDocumentToCollection(user1, 'accounts');
    await dataSource.addDocumentToCollection(user2, 'accounts');
    await dataSource.addDocumentToCollection(user3, 'accounts');

    const targetData = await dataSource.findDocumentInCollection('Ben', 'name', 'accounts');

    expect(targetData).toStrictEqual({});
});