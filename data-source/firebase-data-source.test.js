const {IBackendDataSource, FieldValue} = require("./backend-data-source");
const FirebaseBackedDataSource = require('./firebase-data-source');

beforeAll(async () => {
    process.env.FIRESTORE_EMULATOR_HOST = "localhost:9000"
    const dataSource = new FirebaseBackedDataSource();
    await dataSource.initializeDataSource();
  });

test('Testing adding a new document and retrieving it', async () => {
    const dataSource = new FirebaseBackedDataSource();
    const user = {
        name: 'jhard',
        level: 22
    }; 

    const newPlayer = await dataSource.collection('players').add(user);

    playerPacket = await newPlayer.get();
    expect(playerPacket.exists).toBeTruthy();
    expect(playerPacket.ref).toBe(newPlayer);

    player = playerPacket.data();

    expect(player).toStrictEqual(user);
});

test('Testing adding a multiple documents and retrieving them', async () => {
    const dataSource = new FirebaseBackedDataSource();
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

    player1 = (await newPlayer1.get()).data();
    player2 = (await newPlayer2.get()).data();

    expect(player1).toStrictEqual(user1);
    expect(player2).toStrictEqual(user2);
});

test('Testing getting empty collection', async () => {
    const dataSource = new FirebaseBackedDataSource();
    
    const avatarCollection = dataSource.collection('random_collection');

    const randomSnap = await avatarCollection.doc('random_collection').get();
    expect(randomSnap.exists).toBeFalsy();
    
    const avatars = randomSnap.data();

    expect(avatars).toBeFalsy();
    
});

test('Testing finding document in collection', async () => {
    const dataSource = new FirebaseBackedDataSource();

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
    const dataSource = new FirebaseBackedDataSource();
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
    const dataSource = new FirebaseBackedDataSource();
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
    const dataSource = new FirebaseBackedDataSource();
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
    const dataSource = new FirebaseBackedDataSource();
    const user = {
        name: 'Joker',
        level: 22,
        items: {
            potions: 3
        },
        abilities: ['slash', 'block']
    };

    const playersRef = dataSource.collection('players'); 
    await dataSource.runTransaction(async (transaction) => {
        const query = playersRef.where('name', '==', 'Joker');
        const querySnapshot = await transaction.get(query);

        if(querySnapshot.empty) {
            const newPlayer = playersRef.doc();
            transaction.create(newPlayer, user);
        }
    });

    const querySnapshot = await playersRef.where('name', '==', 'Joker').get();

    expect(querySnapshot.empty).toBeFalsy();
    expect(querySnapshot.docs[0].data()).toStrictEqual(user);
});