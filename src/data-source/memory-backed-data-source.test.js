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

    const player = playerPacket.data();

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

    const playerPacket = await dataSource.collection('players').doc('newPlayer').get();
    const player = playerPacket.data();

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
    expect(newPlayerRef.id).toBeTruthy();

    await newPlayerRef.set(user);

    const playerPacket = await newPlayerRef.get();
    const player = playerPacket.data();

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
    let oldLength = player.abilities.length;

    expect(player.abilities.includes('blast')).toBeTruthy();

    await playerRef.update({'abilities': FieldValue.arrayUnion('blast')});
    player = (await playerRef.get()).data();

    expect(player.abilities.length).toBe(oldLength);

    await playerRef.update({'abilities': FieldValue.arrayRemove('block')});

    player = (await playerRef.get()).data();

    expect(player.abilities.includes('block')).toBeFalsy();
});

test('Remove an object in an object array', async () => {
    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource();

    const user = {
        name: 'jhard',
        level: 22,
        items: {
            potions: 3
        },
        abilities: [{name: 'slash', damage: 40}, {name: 'block', damage: 0}]
    };

    const playerRef = await dataSource.collection('players').add(user);

    await playerRef.update({'abilities': FieldValue.arrayRemove({name: 'block', damage: 0})});
    
    const player = (await playerRef.get()).data();

    expect(player.abilities.length).toBe(1);
    expect(player.abilities[0]).toStrictEqual(user.abilities[0]);
});

test('Testing creating new documents with transactions', async () => {
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

test('Testing setting new documents with transactions', async () => {
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
            transaction.set(newPlayer, user);
        }
    });

    const querySnapshot = await playersRef.where('name', '==', 'jhard').get();

    expect(querySnapshot.empty).toBeFalsy();
    expect(querySnapshot.docs[0].data()).toStrictEqual(user);
});

test('Updating arrays with transactions', async () => {
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

    await dataSource.runTransaction(async (transaction) => {
        const playerSnap = await transaction.get(playerRef);

        if(playerSnap.exists) {
            await transaction.update(playerRef, {abilities: FieldValue.arrayRemove('block')});
        }
    });

    const player = (await playerRef.get()).data();

    expect(player.abilities.includes('block')).toBeFalsy();
});

test('Deleting documents', async () => {
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
    let playerSnap = await playerRef.get();

    expect(playerSnap.exists).toBeTruthy();

    await playerRef.delete();
    playerSnap = await playerRef.get();

    expect(playerSnap.exists).toBeFalsy();
});
//#endregion