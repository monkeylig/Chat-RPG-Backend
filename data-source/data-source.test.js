const {FieldValue} = require("./backend-data-source");
const FirebaseBackedDataSource = require('./firebase-data-source');
const MemoryBackedDataSource = require('./memory-backed-data-source');

process.env.FIRESTORE_EMULATOR_HOST = "localhost:9000"

const firebaseDataSource = new FirebaseBackedDataSource();

beforeAll(async () => {
    await firebaseDataSource.initializeDataSource();
});

describe.each([
//['Firebase', firebaseDataSource],
['Memory', new MemoryBackedDataSource()]
])('%s data source', (testName, dataSource) => {
    test('Adding a new document and retrieving it', async () => {
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
        
        const avatarCollection = dataSource.collection('random_collection');
    
        const randomSnap = await avatarCollection.doc('random_collection').get();
        expect(randomSnap.exists).toBeFalsy();
        
        const avatars = randomSnap.data();
    
        expect(avatars).toBeFalsy();
        
    });

    test('Testing finding document in collection', async () => {
    
        const name = `jhard${Math.random() * 100}`;
        const user1 = {
            name: name,
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
    
        let querySnapshot = await playerCollection.where("name", "==", name).get();
    
        expect(querySnapshot.empty).toBeFalsy();
    
        querySnapshot.forEach(documentSnapshot => {
            expect(documentSnapshot.data()).toStrictEqual(user1);
        });
    
        querySnapshot = await playerCollection.where("name", "==", 'Ben').get();
    
        expect(querySnapshot.empty).toBeTruthy();
    });

    test('Testing updating a document that does not exist', async () => {
        const user = {
            name: 'jhard',
            level: 22
        }; 
    
        await dataSource.collection('players').doc('newPlayer').set(user);
    
        const playerPacket = await dataSource.collection('players').doc('newPlayer').get();
        const player = playerPacket.data();
    
        expect(player).toStrictEqual(user);
    });
    test('Testing adding a new document by future reference', async () => {
        const user = {
            name: 'jhard',
            level: 22
        }; 
    
        const newPlayerRef = dataSource.collection('players').doc();
        await newPlayerRef.set(user);
    
        const playerPacket = await newPlayerRef.get();
        const player = playerPacket.data();
    
        expect(player).toStrictEqual(user);
    });
    
    test('Testing updating existing documents', async () => {
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
        const name = `${Math.random()}`;
        const user = {
            name: name,
            level: 22,
            items: {
                potions: 3
            },
            abilities: ['slash', 'block']
        };
    
        const playersRef = dataSource.collection('players'); 
        await dataSource.runTransaction(async (transaction) => {
            const query = playersRef.where('name', '==', name);
            const querySnapshot = await transaction.get(query);
    
            if(querySnapshot.empty) {
                const newPlayer = playersRef.doc();
                transaction.create(newPlayer, user);
            }
        });
    
        const querySnapshot = await playersRef.where('name', '==', name).get();
    
        expect(querySnapshot.empty).toBeFalsy();
        expect(querySnapshot.docs[0].data()).toStrictEqual(user);
    });
    
    test('Updating arrays with transactions', async () => {
    
        const user = {
            name: 'jake',
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
                await transaction.update(playerSnap.ref, {abilities: FieldValue.arrayRemove('block')});
            }
        });
    
        const player = (await playerRef.get()).data();
    
        expect(player.abilities.includes('block')).toBeFalsy();
    });
    
    test('Deleting documents', async () => {
    
        const user = {
            name: 'gerr',
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

    test('Count collections', async () => {
        const user = {
            name: 'gerr'
        }; 
        const zim = {
            name: 'zim'
        }
    
        const playersRef = dataSource.collection(`players-${Math.random()}`);
        await playersRef.add(user);
        await playersRef.add(zim);
        let countQuery = await playersRef.count().get();

        expect(countQuery.data().count).toBe(2);

        await playersRef.add({name: 'zach'});
        countQuery = await playersRef.count().get();

        expect(countQuery.data().count).toBe(3);

    });
});

/*
test("Firebase timestamp with add()", async () => {
    const user = {
        name: 'jhard',
        level: 22,
        created: FieldValue.Timestamp
    }; 

    const newPlayer = await firebaseDataSource.collection('players').add(user);

    const playerPacket = await newPlayer.get();
    expect(playerPacket.exists).toBeTruthy();
    expect(playerPacket.ref).toBe(newPlayer);

    const player = playerPacket.data();

    expect(player.created).not.toBe(FieldValue.Timestamp);
});

test('Firebase timestamp with set()', async () => {
    const user = {
        name: 'jhard',
        level: 22,
        created: FieldValue.Timestamp
    }; 

    const newPlayerRef = firebaseDataSource.collection('players').doc();
    await newPlayerRef.set(user);

    const playerPacket = await newPlayerRef.get();
    const player = playerPacket.data();

    expect(player.created).not.toBe(FieldValue.Timestamp);
});

test('Firebase timestamp with update()', async () => {
    const user = {
        name: 'jhard',
        level: 22,
        items: {
            potions: 3
        },
        abilities: ['slash', 'block']
    }; 

    const playerRef = await firebaseDataSource.collection('players').add(user);

    await playerRef.update({updated: FieldValue.Timestamp});

    let player = (await playerRef.get()).data();

    expect(player.updated).not.toBe(FieldValue.Timestamp);
});

test('Firebase timestamp with transaction create()', async () => {
    const name = `${Math.random()}`;
    const user = {
        name: name,
        level: 22,
        items: {
            potions: 3
        },
        created: FieldValue.Timestamp,
        abilities: ['slash', 'block']
    };

    const playersRef = firebaseDataSource.collection('players'); 
    await firebaseDataSource.runTransaction(async (transaction) => {
        const query = playersRef.where('name', '==', name);
        const querySnapshot = await transaction.get(query);

        if(querySnapshot.empty) {
            const newPlayer = playersRef.doc();
            transaction.create(newPlayer, user);
        }
    });

    const querySnapshot = await playersRef.where('name', '==', name).get();

    expect(querySnapshot.docs[0].data().created).not.toBe(FieldValue.Timestamp);
});

test('Firebase timestamp with transaction update()', async () => {
    const name = `${Math.random()}`;
    const user = {
        name: name,
        level: 22,
        items: {
            potions: 3
        },
        abilities: ['slash', 'block']
    }; 

    const playerRef = await firebaseDataSource.collection('players').add(user);

    await firebaseDataSource.runTransaction(async (transaction) => {
        const playerSnap = await transaction.get(playerRef);

        if(playerSnap.exists) {
            await transaction.update(playerSnap.ref, {updated: FieldValue.Timestamp});
        }
    });

    const player = (await playerRef.get()).data();

    expect(player.updated).toBeDefined();
    expect(player.updated).not.toBe(FieldValue.Timestamp);

});

test('Firebase timestamp with transaction set()', async () => {
    const name = `${Math.random()}`;
    const user = {
        name: name,
        level: 22,
        items: {
            potions: 3
        },
        abilities: ['slash', 'block']
    }; 

    const playerRef = await firebaseDataSource.collection('players').add(user);

    await firebaseDataSource.runTransaction(async (transaction) => {
        const playerSnap = await transaction.get(playerRef);
        user.updated = FieldValue.Timestamp;
        await transaction.update(playerSnap.ref, user);
    });

    const player = (await playerRef.get()).data();

    expect(player.updated).toBeDefined();
    expect(player.updated).not.toBe(FieldValue.Timestamp);

});
*/