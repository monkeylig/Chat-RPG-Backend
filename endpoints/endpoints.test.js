/**
 * @import {ObjectMapper} from '../chat-rpg/object-mapping'
 */

const ChatRPG = require('../chat-rpg/chat-rpg');
const Schema = require('../chat-rpg/datasource-schema');
const { Player } = require('../chat-rpg/datastore-objects/agent');
const { InventoryPage } = require('../chat-rpg/datastore-objects/inventory-page');
const { ShopItem, Shop } = require('../chat-rpg/datastore-objects/shop');
const { Weapon } = require('../chat-rpg/datastore-objects/weapon');
const MemoryBackedDataSource = require('../data-source/memory-backed-data-source');
const endpoints = require('./endpoints');

class Res {
    returnStatus = 0;
    message = null;
    headers = {};
    onMessageReceived;

    constructor() {
        this.resPromise = new Promise((resolve, reject) => {
            this.onMessageReceived = message => { resolve(message) };
        });
    }

    status(value) {
        this.returnStatus = value;
    }

    send(data) {
        this.message = data;
        const messageObject = JSON.parse(this.message);

        if (this.onMessageReceived) {
            this.onMessageReceived(messageObject);
        }
    }

    set(headerName, value) {
        this.headers[headerName] = value;
    }

    async waitForMessage() {
        return await this.resPromise;
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

test('Find Player', async () => {
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

test("Join Game", async () => {
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
            playerId: 'jhard',
            gameId: 'new game'
        }
    };
    endpoints.join_game(req, res, chatrpg);
    let game = await res.waitForMessage();

    expect(game.id).toBe('new game');
});

test('Move object from bag to inventory', async () => {
    const player = new Player();
    player.addWeaponToBag(new Weapon({name: 'weapon 1'}));
    player.addWeaponToBag(new Weapon({name: 'weapon 2'}));

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        accounts: {
            player1: player.getData()
        }
    });

    const chatrpg = new ChatRPG(dataSource);

    let res = new Res();
    let req = {
        query: {
            playerId: 'player1',
            objectId: player.getData().bag.objects[0].id
        }
    };

    endpoints.move_object_from_bag_to_inventory(req, res, chatrpg);
    let playerData = await res.waitForMessage();

    expect(playerData.player.id).toBe('player1');
    expect(playerData.player.bag.objects.length).toBe(1);
});

test('Get inventory page', async () => {
    const page = new InventoryPage();
    page.addObjectToInventory({name: 'object1'});
    page.addObjectToInventory({name: 'object2'});
    const player = new Player();
    player.onObjectAddedToInventory('page1');

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        [Schema.Collections.Accounts]: {
            player1: player.getData()
        },
        [Schema.Collections.InventoryPages]: {
            page1: page.getData()
        }
    });

    const chatrpg = new ChatRPG(dataSource);

    let res = new Res();
    let req = {
        query: {
            playerId: 'player1',
            pageId: 'page1'
        }
    };

    endpoints.get_inventory_page(req, res, chatrpg);
    let pageData = await res.waitForMessage();

    expect(pageData.id).toBe('page1')
    expect(pageData.objects.length).toBe(2);
});

test('Move object from inventory to bag', async () => {
    const player = new Player();
    const page = new InventoryPage();
    const inventoryObject = page.addObjectToInventory({name: 'weapon'}, 'weapon');
    const page1Id = 'page1';
    player.onObjectAddedToInventory(page1Id);

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        [Schema.Collections.Accounts]: {
            player1: player.getData()
        },
        [Schema.Collections.InventoryPages]: {
            [page1Id]: page.getData()
        }
    });

    const chatrpg = new ChatRPG(dataSource);

    const oldBagSize = player.getData().bag.objects.length;
    const oldPageSize = page.getData().objects.length;

    let res = new Res();
    let req = {
        query: {
            playerId: 'player1',
            pageId: page1Id,
            objectId: inventoryObject.id
        }
    };

    endpoints.move_object_from_inventory_to_bag(req, res, chatrpg);
    let {player: playerData, page: pageData} = await res.waitForMessage();

    expect(playerData.bag.objects.length).toBe(oldBagSize + 1);
    expect(pageData.objects.length).toBe(oldPageSize - 1);
});

test('Buying stuff', async () => {
    let player = new Player({coins: 20});
    const shopItem = new ShopItem(
        {
            type: 'item',
            price: 10,
            product: {
                name: 'Test Product',
                count: 1
            }
        });

    const shop = new Shop({
        title: 'Test Shop',
        description: 'Testing the shop'
    });

    shop.addShopItem(shopItem);

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        shops: {
            daily: {
                ...shop.getData()
            }
        },
        accounts: {
            player1: player.getData()
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    let res = new Res();
    let req = {
        query: {
            playerId: 'player1',
            shopId: 'daily',
            productId: shop.getData().products[0].id
        }
    };

    endpoints.buy(req, res, chatrpg);
    let playerData = await res.waitForMessage();

    expect(playerData).toBeDefined();
    expect(playerData.id).toBe('player1');
    expect(playerData.coins).toBe(10);

    player = new Player(playerData);
    let newItem = player.findObjectInBagByName('Test Product');

    expect(newItem).toBeDefined();
    expect(newItem.content).toBeDefined();
    expect(newItem.content.count).toBe(1);
});

test("Resetting Account", async () => {
    let player = new Player({coins: 20});

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        accounts: {
            player1: player.getData()
        }
    });

    let chatrpg = new ChatRPG(dataSource);

    let res = new Res();
    let req = {
        query: {
            playerId: 'player1',
        }
    };

    endpoints.resetAccount(req, res, chatrpg);
    let playerData = await res.waitForMessage();

    expect(playerData.message).toMatch("OK");
});

test("/sell", async () => {
    let player = new Player();
    const objectToSell = player.addObjectToBag(new Weapon({stars: 3}).getData(), 'weapon');
    if (!objectToSell) {fail();}

    const shop = new Shop({
        /**@type {ObjectMapper} */
        resellListing: {
            keyFields: [
                {
                    key: {
                        mapFields: [
                            {
                                fieldName: 'stars',
                                value: 3
                            }
                        ]
                    },
                    value: 20
                }
            ],
            default: 10
        }
    });

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        [Schema.Collections.Accounts]: {
            ['player']: player.getData()
        },
        [Schema.Collections.Shops]: {
            ['shop']: shop.getData()
        }
    });

    const chatRPG = new ChatRPG(dataSource);

    let res = new Res();
    let req = {
        query: {
            playerId: 'player',
            objectId: objectToSell.id,
            shopId: 'shop'
        }
    };

    // @ts-ignore
    endpoints.sell(req, res, chatRPG);
    const response = await res.waitForMessage();

    expect(response.player).toBeDefined();
    expect(response.player.id).toMatch('player');
    expect(response.inventoryPage).toBeUndefined();

    player = new Player(response.player);
    
    expect(player.getData().coins).toBe(20);
    expect(player.findObjectInBag(objectToSell.id)).toBeUndefined();
});

test("/sell inventory", async () => {
    let player = new Player();

    let page = new InventoryPage({}, 'page', player);
    let objectToSell = page.addObjectToInventory({stars: 3, count: 3}, 'weapon')
    if (!objectToSell) {fail();}

    const shop = new Shop({
        /**@type {ObjectMapper} */
        resellListing: {
            keyFields: [
                {
                    key: {
                        mapFields: [
                            {
                                fieldName: 'stars',
                                value: 3
                            }
                        ]
                    },
                    value: 20
                }
            ],
            default: 10
        }
    });

    const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource({
        [Schema.Collections.Accounts]: {
            ['player']: player.getData()
        },
        [Schema.Collections.Shops]: {
            ['shop']: shop.getData()
        },
        [Schema.Collections.InventoryPages]: {
            ['page']: page.getData()
        }
    });

    const chatRPG = new ChatRPG(dataSource);

    let res = new Res();
    let req = {
        query: {
            playerId: 'player',
            objectId: objectToSell.id,
            shopId: 'shop'
        },
        body: {
            itemLocation: {
                inventory: {
                    pageId:'page'
                }
            }
        }
    };

    // @ts-ignore
    endpoints.sell(req, res, chatRPG);
    const response = await res.waitForMessage();

    expect(response.player).toBeDefined();
    expect(response.player.id).toMatch('player');
    expect(response.inventoryPage).toBeDefined();
    expect(response.inventoryPage.id).toMatch('page');

    player = new Player(response.player);
    page = new InventoryPage(response.inventoryPage);
    
    expect(player.getData().coins).toBe(20);

    const newObject = page.findObjectById(objectToSell.id);

    if (!newObject) {fail();}
    expect(newObject).toBeDefined();
    expect(newObject.content.count).toBe(2);
});

//TODO: Make equip weapon test