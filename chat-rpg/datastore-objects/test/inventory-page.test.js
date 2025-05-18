const { Player } = require("../agent");
const { InventoryPage } = require("../inventory-page");

test('Add object to inventory', () => {
    const page = new InventoryPage();

    let newObject = page.addObjectToInventory({name: 'weapon 1'}, 'weapon');
    
    if (!newObject) {fail();}

    expect(newObject).toBeDefined();
    expect(newObject.type).toMatch('weapon');
    expect(page.getData().objects).toBeDefined();
    expect(page.getData().objects.length).toBe(1);
    expect(page.getData().objects[0].content).toBeDefined();
    expect(page.getData().objects[0].content.name).toMatch('weapon 1');
    expect(newObject.content).toStrictEqual(page.getData().objects[0].content);

    for(let i = 0; i < InventoryPage.PAGE_CAPACITY - 1; i++) {
        page.addObjectToInventory({name: 'random weapon'}, 'weapon');
    }

    newObject = page.addObjectToInventory({name: 'wont make it'}, 'weapon');

    expect(newObject).not.toBeDefined();
    expect(page.isFull()).toBeTruthy();
});

test('Drop object from inventory', () => {
    const page = new InventoryPage();

    const newObject = page.addObjectToInventory({name: 'weapon 1'}, 'weapon');

    if (!newObject) {fail();}

    const droppedObject = page.dropObjectFromInventory(newObject.id);
    
    if (!droppedObject) {fail();}

    expect(droppedObject.id).toBe(newObject.id);
    expect(droppedObject.content).toStrictEqual(newObject.content);
});

test('Notify player of inventory changes', () => {
    const player = new Player();
    const page = new InventoryPage({}, 'id', player);

    expect(player.getData().inventory.leger.length).toBe(0);

    const newObject = page.addObjectToInventory({name: 'weapon 1'}, 'weapon');

    if (!newObject) {fail();}

    expect(player.getData().inventory.leger.length).toBe(1);
    expect(player.getData().inventory.leger[0].count).toBe(1);
    expect(player.getData().inventory.leger[0].id).toBe('id');

    page.dropObjectFromInventory(newObject.id);

    expect(player.getData().inventory.leger.length).toBe(1);
    expect(player.getData().inventory.leger[0].count).toBe(0);
    expect(player.getData().inventory.leger[0].id).toBe('id');
});
