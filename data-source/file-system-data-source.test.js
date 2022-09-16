const fs = require('fs/promises');
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
        await fs.unlink(fileName);
    }

    return userData;
}

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