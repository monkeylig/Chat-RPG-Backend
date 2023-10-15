const { Player } = require("./agent");
const { InventoryPage } = require("./inventory-page");

test('Revive', () => {
    const player = new Player();
    player.getData().health = 1;
    player.revive();

    expect(player.getData().health).toBe(1);

    player.getData().health = 0;
    player.revive(0.5);

    expect(player.getData().health).toBe(Math.floor(player.getData().maxHealth / 2));
});

test('Updating the inventory leger', () => {
    const player = new Player();
    player.onObjectAddedToInventory("page1");

    const leger = player.getData().inventory.leger;
    
    expect(leger.length).toBe(1);
    expect(leger[0].id).toMatch('page1');
    expect(leger[0].count).toBe(1);

    player.onObjectAddedToInventory("page1");

    expect(leger.length).toBe(1);
    expect(leger[0].count).toBe(2);

    player.onObjectAddedToInventory("page2");

    expect(leger.length).toBe(2);
    expect(leger[1].id).toMatch('page2');
    expect(leger[1].count).toBe(1);

    player.onObjectAddedToInventory("page2");
    
    expect(leger.length).toBe(2);
    expect(leger[1].count).toBe(2);

    player.onObjectRemovedFromInventory("page2");

    expect(leger[1].count).toBe(1);

    player.onObjectRemovedFromInventory("page2");

    expect(leger[1].count).toBe(0);

    player.onObjectRemovedFromInventory("page2");

    expect(leger[1].count).toBe(0);

    player.onObjectRemovedFromInventory("page3");

    expect(leger.length).toBe(2);
});


test('Get Next Inventory Page', () => {
    const player = new Player();
    expect(player.getNextAvailableInventoryPageId()).not.toBeDefined();

    player.onObjectAddedToInventory("page1");

    expect(player.getNextAvailableInventoryPageId()).toMatch("page1");

    for(let i = 0; i < InventoryPage.PAGE_CAPACITY - 1; i++) {
        player.onObjectAddedToInventory("page1");
    }

    expect(player.getNextAvailableInventoryPageId()).not.toBeDefined();

    player.onObjectAddedToInventory("page2");

    expect(player.getNextAvailableInventoryPageId()).toMatch("page2");
});

test('Get Next Inventory Page: Filling gaps', () => {
    const player = new Player();

    for(let i = 0; i < InventoryPage.PAGE_CAPACITY - 1; i++) {
        player.onObjectAddedToInventory("page1");
    }

    player.onObjectAddedToInventory("page2");

    expect(player.getNextAvailableInventoryPageId()).toMatch("page1");

    player.onObjectAddedToInventory("page1");
    
    expect(player.getNextAvailableInventoryPageId()).toMatch("page2");
});

test('Get inventory page log', () => {
    const player = new Player();
    player.onObjectAddedToInventory("page1");

    const pageLog = player.getInventoryPageLog("page1");

    expect(pageLog).toBeDefined();
    expect(pageLog.count).toBe(1);
    expect(pageLog.id).toBe('page1');

    expect(player.getInventoryPageLog("page2")).not.toBeDefined()
});