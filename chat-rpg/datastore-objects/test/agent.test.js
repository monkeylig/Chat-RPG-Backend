const Ability = require("../ability");
const { Player, Agent } = require("../agent");
const { InventoryPage } = require("../inventory-page");

test('Adding and removing effects', () => {
    const agent = new Agent();
    agent.setEffect({
        targetId: 'player',
        className: 'HealingFactor',
        inputData: {hps: 50},
        persistentId: 'hf'
    });

    expect(agent.getData().effectsMap.hf.className).toMatch('HealingFactor');
    expect(agent.getData().effectsMap.hf.inputData.hps).toBe(50);

    agent.removeEffect('hf');

    expect(agent.getData().effectsMap.hf).toBeUndefined();
});

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

test('Add and remove abilities', () => {
    const player = new Player();
    const ability1 = new Ability({name: "ability1"});
    const ability2 = new Ability({name: "ability2"});
    const ability3 = new Ability({name: "ability3"});

    player.addAbility(ability1.getData());
    player.addAbility(ability2.getData());
    player.addAbility(ability3.getData());
    const abilities = player.getData().abilities;

    expect(abilities.length).toBe(3);
    expect(abilities[0].name).toBe("ability1");
    expect(abilities[1].name).toBe("ability2");
    expect(abilities[2].name).toBe("ability3");

    player.removeAbility(ability2.getData().name);

    expect(abilities.length).toBe(2);
    expect(abilities[0].name).toBe("ability1");
    expect(abilities[1].name).toBe("ability3");
});