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

test('Testing adding a new account', async () => {
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

test('Testing adding multiple accounts', async () => {
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

    expect(userData["accounts"][0]).toStrictEqual(user1);
    expect(userData["accounts"][1]).toStrictEqual(user2);
});

test('Testing adding acconts with existing data', async () => {
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

test('Testing getting avatars with none available', async () => {
    const dataSource = new FileSystemDataSource();
    await dataSource.initializeDataSource();

    const avatars = dataSource.getStartingAvatars();

    expect(avatars).toStrictEqual({});
});

test('Testing getting avatars', async () => {
    
    // Test datasource
    goldAvatars = {
        starting_avatars: ['dolfin.png', 'eric.png', 'kris.png', 'jhard.png']
    }

    await writeJSONObject(FileSystemDataSource.defaultDataSourceFileName, goldAvatars);

    const dataSource = new FileSystemDataSource();
    await dataSource.initializeDataSource();

    const avatars = dataSource.getStartingAvatars();

    expect(avatars).toStrictEqual(goldAvatars.starting_avatars);
});
