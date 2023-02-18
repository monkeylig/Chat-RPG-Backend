const fs = require('fs/promises');
const fsSync = require('fs');
const FileSystemDataSource = require('./file-system-data-source');

async function getJSONFileContents(fileName) {
    let fileHandle;
    let userData;

    try {
        fileHandle = await fs.open(fileName, 'r');
        let fileContent = await fileHandle.readFile({encoding: 'UTF8'});
        userData = JSON.parse(fileContent);
    } finally {
        await fileHandle?.close();
    }

    return userData;
}

async function writeJSONObject(filename, obj) {
    let fileHandle;
    try {
        fileHandle = await fs.open(filename, 'w');
        await fileHandle.writeFile(JSON.stringify(obj));
    } finally {
        await fileHandle.close();
    }
}

afterEach(async () => {
    try {
        await fs.unlink(FileSystemDataSource.defaultDataSourceFileName);
    } catch(error) {
    }
  });

test('Testing initialization with default filename', async () => {
    const fileName = FileSystemDataSource.defaultDataSourceFileName;
    const dataSource = new FileSystemDataSource();
    await dataSource.initializeDataSource();

    testExistance = () => {
        let fileHandle;
        fileHandle = fsSync.openSync(fileName, 'r');
        fsSync.closeSync(fileHandle);
        fsSync.unlinkSync(fileName);
    };

    expect(testExistance).not.toThrow();
});

test('Testing initialization with custom filename', async () => {
    const fileName = 'test-source.json';
    const dataSource = new FileSystemDataSource();
    await dataSource.initializeDataSource(fileName);

    testExistance = () => {
        let fileHandle;
        fileHandle = fsSync.openSync(fileName, 'r');
        fsSync.closeSync(fileHandle);
        fsSync.unlinkSync(fileName);
    };

    expect(testExistance).not.toThrow();

});

test('Testing adding a new account (legacy)', async () => {
    const dataSource = new FileSystemDataSource();
    await dataSource.initializeDataSource();
    const user = {
        name: 'jhard',
        level: 22
    }; 

    await dataSource.addAccount(user);

    const userData = await getJSONFileContents(FileSystemDataSource.defaultDataSourceFileName);    
    expect(userData["accounts"][0]).toStrictEqual(user);

});

test('Testing adding multiple accounts (legacy)', async () => {
    const dataSource = new FileSystemDataSource();
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

    const userData = await getJSONFileContents(FileSystemDataSource.defaultDataSourceFileName);

    expect(userData.accounts.length).toEqual(2);
    expect(userData["accounts"][0]).toStrictEqual(user1);
    expect(userData["accounts"][1]).toStrictEqual(user2);
});

test('Testing adding accounts with existing data (legacy)', async () => {
    let dataSource = new FileSystemDataSource();
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

    await dataSource.addAccount(user1);
    await dataSource.addAccount(user2);

    dataSource = new FileSystemDataSource();
    await dataSource.initializeDataSource();

    await dataSource.addAccount(user3);

    const userData = await getJSONFileContents(FileSystemDataSource.defaultDataSourceFileName);

    expect(userData["accounts"][2]).toStrictEqual(user3);
});

test('Testing getting avatars with none available (legacy)', async () => {
    const dataSource = new FileSystemDataSource();
    await dataSource.initializeDataSource();

    const avatars = await dataSource.getStartingAvatars();

    expect(avatars).toStrictEqual({});
});

test('Testing getting avatars (legacy)', async () => {
    
    // Test datasource
    goldAvatars = {
        starting_avatars: ['dolfin.png', 'eric.png', 'kris.png', 'jhard.png']
    }

    await writeJSONObject(FileSystemDataSource.defaultDataSourceFileName, goldAvatars);

    const dataSource = new FileSystemDataSource();
    await dataSource.initializeDataSource();

    const avatars = await dataSource.getStartingAvatars();

    expect(avatars).toStrictEqual(goldAvatars.starting_avatars);
});

test('Testing getting empty collection', async () => {
    const dataSource = new FileSystemDataSource();
    await dataSource.initializeDataSource();

    const avatars = await dataSource.getCollection('starting_avatars');

    expect(avatars).toStrictEqual([]);
});

test('Testing getting populated collection', async () => {
    
    // Test datasource
    goldAvatars = {
        starting_avatars: ['dolfin.png', 'eric.png', 'kris.png', 'jhard.png']
    }

    await writeJSONObject(FileSystemDataSource.defaultDataSourceFileName, goldAvatars);

    const dataSource = new FileSystemDataSource();
    await dataSource.initializeDataSource();

    const avatars = await dataSource.getCollection('starting_avatars');

    expect(avatars).toStrictEqual(goldAvatars.starting_avatars);
});

test('Testing adding a new document to collection', async () => {
    const dataSource = new FileSystemDataSource();
    await dataSource.initializeDataSource();
    const user = {
        name: 'jhard',
        level: 22
    }; 

    const newUser = await dataSource.addDocumentToCollection(user, 'accounts');

    user._id = newUser._id;
    
    expect(newUser).toStrictEqual(user);

});

test('Testing adding multiple documents to collection', async () => {
    const dataSource = new FileSystemDataSource();
    await dataSource.initializeDataSource();

    const user1 = {
        name: 'jhard',
        level: 22
    };

    const user2 = {
        name: 'ochiva',
        level: 13
    };

    await dataSource.addDocumentToCollection(user1, 'accounts');
    await dataSource.addDocumentToCollection(user2, 'accounts');

    const userData = await getJSONFileContents(FileSystemDataSource.defaultDataSourceFileName);

    expect(userData.accounts.length).toEqual(2);
    expect(userData["accounts"][0]).toStrictEqual(user1);
    expect(userData["accounts"][1]).toStrictEqual(user2);
});

test('Testing adding multiple documents to collection with custom filename', async () => {
    const dataSource = new FileSystemDataSource();
    const filename = './private-game.json';
    await dataSource.initializeDataSource(filename);

    const user1 = {
        name: 'jhard',
        level: 22
    };

    const user2 = {
        name: 'ochiva',
        level: 13
    };

    await dataSource.addDocumentToCollection(user1, 'accounts');
    await dataSource.addDocumentToCollection(user2, 'accounts');

    const userData = await getJSONFileContents(filename);

    expect(userData.accounts.length).toEqual(2);
    expect(userData["accounts"][0]).toStrictEqual(user1);
    expect(userData["accounts"][1]).toStrictEqual(user2);

    cleanup = () => {
        fsSync.unlinkSync(filename);
    };

    expect(cleanup).not.toThrow();
});

test('Testing adding documents with existing data', async () => {
    let dataSource = new FileSystemDataSource();
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

    dataSource = new FileSystemDataSource();
    await dataSource.initializeDataSource();

    const newUser = await dataSource.addDocumentToCollection(user3, 'accounts');

    const userData = await getJSONFileContents(FileSystemDataSource.defaultDataSourceFileName);
    expect(userData["accounts"][2]).toStrictEqual(user3);
});

test('Testing finding document in collection', async () => {
    let dataSource = new FileSystemDataSource();
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
    let dataSource = new FileSystemDataSource();
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
    let dataSource = new FileSystemDataSource();
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