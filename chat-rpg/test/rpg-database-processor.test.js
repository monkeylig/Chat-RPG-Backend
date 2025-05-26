const { FieldValue } = require("../../data-source/backend-data-source");
const MemoryBackedDataSource = require("../../data-source/memory-backed-data-source");
const Schema = require("../datasource-schema");
const { RPGDatabaseProcessor } = require("../rpg-database-processor");

test('Missing data', () => {
    const dbProcessor = new RPGDatabaseProcessor();
    const dataSource = new MemoryBackedDataSource();
    const accounts = dataSource.collection(Schema.Collections.Accounts);
    const testPlayer = accounts.doc("testPlayer");

    dbProcessor.onWrite(accounts, testPlayer, null, "set");
});

describe.each([
    ['set'],
    ['update'],
    ['add'],
    ['create'],
])('RPG Database Processor: Update last action on %s', (method) => {
    test('Check for fresh timestamp', () => {
        const dbProcessor = new RPGDatabaseProcessor();
        const dataSource = new MemoryBackedDataSource();
        const accounts = dataSource.collection(Schema.Collections.Accounts);
        const testPlayer = accounts.doc("testPlayer");
        const testData = {};

        dbProcessor.onWrite(accounts, testPlayer, testData, "set");

        expect(testData.lastAction).toBeDefined();
        expect(testData.lastAction).toMatch(FieldValue.Timestamp);
    });

});


test('Remove created field', () => {
    const dbProcessor = new RPGDatabaseProcessor();
    const dataSource = new MemoryBackedDataSource();
    const accounts = dataSource.collection(Schema.Collections.Accounts);
    const testPlayer = accounts.doc("testPlayer");
    const testData = {
        created: FieldValue.Timestamp
    };

    dbProcessor.onWrite(accounts, testPlayer, testData, "set");

    expect(testData.created).toMatch(FieldValue.Timestamp);

    testData.created = "2023-10-01T00:00:00Z";

    dbProcessor.onWrite(accounts, testPlayer, testData, "set");

    expect(testData.created).toBeUndefined();

});