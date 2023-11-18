const ChatRPG = require('../chat-rpg/chat-rpg');
const Schema = require('../chat-rpg/datasource-schema');
const { Player } = require('../chat-rpg/datastore-objects/agent');
const MemoryBackedDataSource = require('../data-source/memory-backed-data-source');
const endpoints = require('./endpoints');

class Res {
    returnStatus = 0;
    message = null;
    headers = {};

    status(value) {
        this.returnStatus = value;
    }

    send(data) {
        this.message = data;
    }

    set(headerName, value) {
        this.headers[headerName] = value;
    }

    async waitForMessage() {
        while(!this.message) {
            await new Promise(resolve => setTimeout(resolve, 1));
        }

        return JSON.parse(this.message);
    }
}

test('Get game Info', async () => {
    const testGameInfo = {
        startingWeapons: {
            physical: {
                name: "Brave Cutlass",
                icon: "brave_cutlass.webp"
            },
            magical: {
                name: "Duelist's Bane",
                icon: "duelists_bane.png"
            }
        }
    };

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        configs: {
            gameInfo: testGameInfo
        }
    });
    const chatrpg = new ChatRPG(dataSource);

    const res = new Res();
    endpoints.get_game_info({}, res, chatrpg);
    const gameInfo = await res.waitForMessage();

    expect(gameInfo).toStrictEqual(testGameInfo);
});

test('Create new player', async () => {
    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource();
    const chatrpg = new ChatRPG(dataSource);

    const res = new Res();
    const req = {
        query: {
            platform: 'twitch'
        },
        body: {
            name: 'jhard',
            playerId: 'jhardTwitch',
            avatar: 'avatar.png',
            vitalityBonus: 'health',
            weaponType: 'physical'
        }
    };
    endpoints.create_new_player(req, res, chatrpg);
    const player = await res.waitForMessage();

    expect(player.name).toBe('jhard');
    expect(player.weapon).toBeDefined();
});

test('New Player', async () => {
    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        [Schema.Collections.Accounts]: {
            jhard: new Player({
                name: 'justin',
                twitchId: 'arrf'
            }).getData()
        }
    });
    const chatrpg = new ChatRPG(dataSource);

    let res = new Res();
    let req = {
        query: {
            platform: 'twitch',
            playerId: 'arrf'
        }
    };
    endpoints.get_player(req, res, chatrpg);
    let player = await res.waitForMessage();

    expect(player.twitchId).toBe('arrf');
    expect(player.id).toBe('jhard');

    res = new Res();
    req = {
        query: {
            playerId: 'jhard'
        }
    };
    endpoints.get_player(req, res, chatrpg);
    player = await res.waitForMessage();

    expect(player.twitchId).toBe('arrf');
    expect(player.id).toBe('jhard');

});