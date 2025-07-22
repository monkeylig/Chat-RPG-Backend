//@ts-check

const { EXP_LEVEL_CAP } = require("../../battle-system/utility");
const Ability = require("../ability");
const { Player, Agent } = require("../agent");
const { InventoryPage } = require("../inventory-page");

test("Exp calculation", () => {
    const expFunc = (level) => Math.floor(level**3 * 5/4);
    expect(Agent.getExpToNextLevel(-2)).toBe(0);
    expect(Agent.getExpToNextLevel(-1)).toBe(0);
    expect(Agent.getExpToNextLevel(0)).toBe(0);
    expect(Agent.getExpToNextLevel(1)).toBe(expFunc(2));
    expect(Agent.getExpToNextLevel(10)).toBe(expFunc(11) - expFunc(10));
    expect(Agent.getExpToNextLevel(20)).toBe(expFunc(21) - expFunc(20));
    expect(Agent.getExpToNextLevel(30)).toBe(expFunc(31) - expFunc(30));
    expect(Agent.getExpToNextLevel(EXP_LEVEL_CAP-1)).toBe(expFunc(EXP_LEVEL_CAP) - expFunc(EXP_LEVEL_CAP - 1));
    expect(Agent.getExpToNextLevel(EXP_LEVEL_CAP + 1)).toBe(Agent.getExpToNextLevel(EXP_LEVEL_CAP + 1000));
});

test('Changing levels', () => {
    const startingStats = {
        maxHealth: 12,
        health: 12,
        strength: 1,
        magic: 1,
        defense: 1
    }
    const agent = new Agent(startingStats);

    expect(agent.getData().level).toBe(1);

    agent.levelUp();

    expect(agent.getData().level).toBe(2);
    expect(agent.getData().maxHealth).toBeGreaterThan(12);
    expect(agent.getData().health).toBe(agent.getData().maxHealth);
    expect(agent.getData().strength).toBeGreaterThan(1);
    expect(agent.getData().magic).toBeGreaterThan(1);
    expect(agent.getData().defense).toBeGreaterThan(1);

    let oldMaxHealth = agent.getData().maxHealth;
    let oldStrength = agent.getData().strength;
    let oldMagic = agent.getData().magic;
    let oldDefense = agent.getData().defense;

    agent.levelUp();

    expect(agent.getData().level).toBe(3);
    expect(agent.getData().maxHealth).toBeGreaterThan(oldMaxHealth);
    expect(agent.getData().health).toBe(agent.getData().maxHealth);
    expect(agent.getData().strength).toBeGreaterThan(oldStrength);
    expect(agent.getData().magic).toBeGreaterThan(oldMagic);
    expect(agent.getData().defense).toBeGreaterThan(oldDefense);

});

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

    const abilityName = ability2.getData().name;

    if (!abilityName) {fail();}
    player.removeAbility(abilityName);

    expect(abilities.length).toBe(2);
    expect(abilities[0].name).toBe("ability1");
    expect(abilities[1].name).toBe("ability3");
});

test('Equip and replace abilities', () => {
    const player = new Player();
    const ability1 = new Ability({name: "ability1"});
    const ability2 = new Ability({name: "ability2"});
    const ability3 = new Ability({name: "ability3"});

    player.equipAbility(ability1.getData());

    expect(player.mysticAbilities.length).toBe(1);

    player.equipAbility(ability2.getData());

    expect(player.mysticAbilities.length).toBe(2);

    player.equipAbility(ability3.getData(), 'ability1');

    expect(player.mysticAbilities.length).toBe(2);

});

test('Prevent duplicate abilities', () => {
    const player = new Player();
    const ability1 = new Ability({name: "ability1"});
    const ability2 = new Ability({name: "ability2"});
    const ability3 = new Ability({name: "ability3"});

    player.addAbility(ability1.getData());
    player.addAbility(ability2.getData());
    player.addAbility(ability3.getData());
    const abilities = player.getData().abilities;

    expect(player.addAbility(new Ability({name: "ability1"}).getData())).toBe(false);
    expect(abilities.length).toBe(3);
});
