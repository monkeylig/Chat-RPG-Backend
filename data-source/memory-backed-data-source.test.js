const {IBackendDataSource, FieldValue} = require("./backend-data-source");
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

//#region legacy
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
//#endregion

//#region gen 2
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

test('Testing updating documents in a collection', async () => {
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

    let filter = {
        level: 13
    };

    let updateDoc = {
        $set: {
            level: 14
        }
    };

    await dataSource.updateDocumentInCollection(filter, updateDoc, 'accounts');

    const targetData1 = await dataSource.findDocumentInCollection('ochiva', 'name', 'accounts');
    const targetData2 = await dataSource.findDocumentInCollection('kriskyme', 'name', 'accounts');
    
    expect(targetData1.level).toEqual(14);
    expect(targetData2.level).toEqual(14);

    filter = {
        name: 'jhard'
    }

    updateDoc = {
        $set: {
            level: 100
        }
    }

    await dataSource.updateDocumentInCollection(filter, updateDoc, 'accounts');

    const targetData3 = await dataSource.findDocumentInCollection('jhard', 'name', 'accounts');

    expect(targetData3.level).toEqual(100);
});

//#endregion

//#region gen 3
test('Testing adding a new document and retrieving it', async () => {
    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource();

    const user = {
        name: 'jhard',
        level: 22
    }; 

    const newPlayer = await dataSource.collection('players').add(user);

    const playerPacket = await newPlayer.get();
    expect(playerPacket.exists).toBeTruthy();
    expect(playerPacket.ref).toBe(newPlayer);

    player = playerPacket.data();

    expect(player).toStrictEqual(user);
});

test('Testing adding a multiple documents and retrieving them', async () => {
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

    const newPlayer1 = await dataSource.collection('players').add(user1);
    const newPlayer2 = await dataSource.collection('players').add(user2);

    const player1 = (await newPlayer1.get()).data();
    const player2 = (await newPlayer2.get()).data();

    expect(player1).toStrictEqual(user1);
    expect(player2).toStrictEqual(user2);
});

test('Testing getting empty collection', async () => {
    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource();
    
    const avatarCollection = dataSource.collection('random_collection');

    const randomSnap = await avatarCollection.doc('random_collection').get();
    expect(randomSnap.exists).toBeFalsy();
    
    const avatars = randomSnap.data();

    expect(avatars).toBeFalsy();
    
});

test('Testing finding document in collection', async () => {
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

    const user3 = {
        name: 'kriskyme',
        level: 13
    };

    const playerCollection = dataSource.collection('players');
    await playerCollection.add(user1);
    await playerCollection.add(user2);
    await playerCollection.add(user3);

    let querySnapshot = await playerCollection.where("name", "==", 'jhard').get();

    expect(querySnapshot.empty).toBeFalsy();

    querySnapshot.forEach(documentSnapshot => {
        expect(documentSnapshot.data()).toStrictEqual(user1);
    });

    querySnapshot = await playerCollection.where("name", "==", 'Ben').get();

    expect(querySnapshot.empty).toBeTruthy();
});

test('Testing updating a document that does not exist', async () => {
    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource();
    const user = {
        name: 'jhard',
        level: 22
    }; 

    await dataSource.collection('players').doc('newPlayer').set(user);

    playerPacket = await dataSource.collection('players').doc('newPlayer').get();
    player = playerPacket.data();

    expect(player).toStrictEqual(user);
});

test('Testing adding a new document by future refrence', async () => {
    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource();
    const user = {
        name: 'jhard',
        level: 22
    }; 

    const newPlayerRef = dataSource.collection('players').doc();
    await newPlayerRef.set(user);

    playerPacket = await newPlayerRef.get();
    player = playerPacket.data();

    expect(player).toStrictEqual(user);
});

test('Testing updating existing documents', async () => {
    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource();

    const user = {
        name: 'jhard',
        level: 22,
        items: {
            potions: 3
        },
        abilities: ['slash', 'block']
    }; 

    const playerRef = await dataSource.collection('players').add(user);

    await playerRef.update({level: 100});

    let player = (await playerRef.get()).data();

    expect(player.level).toBe(100);

    await playerRef.update({'items.potions': 10});

    player = (await playerRef.get()).data();

    expect(player.items.potions).toBe(10);

    await playerRef.update({'abilities': FieldValue.arrayUnion('blast')});

    player = (await playerRef.get()).data();

    expect(player.abilities.includes('blast')).toBeTruthy();

    await playerRef.update({'abilities': FieldValue.arrayRemove('block')});

    player = (await playerRef.get()).data();

    expect(player.abilities.includes('block')).toBeFalsy();
});

test('testing creating new documents with transactions', async () => {
    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource();
    const user = {
        name: 'jhard',
        level: 22,
        items: {
            potions: 3
        },
        abilities: ['slash', 'block']
    };

    const playersRef = dataSource.collection('players'); 
    await dataSource.runTransaction(async (transaction) => {
        const query = playersRef.where('name', '==', 'jhard');
        const querySnapshot = await transaction.get(query);

        if(querySnapshot.empty) {
            const newPlayer = playersRef.doc();
            transaction.create(newPlayer, user);
        }
    });

    const querySnapshot = await playersRef.where('name', '==', 'jhard').get();

    expect(querySnapshot.empty).toBeFalsy();
    expect(querySnapshot.docs[0].data()).toStrictEqual(user);
});
//#endregion