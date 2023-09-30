const DatastoreObject = require('./datastore-object');
const utility = require("../../utility");

class InventoryPage extends DatastoreObject {
    static PAGE_CAPACITY = 25;

    constructor(objectData) {
        super(objectData);
    }

    constructNewObject(page) {
        page.objects = [];
    }

    isFull() {
        return this.datastoreObject.objects.length >= InventoryPage.PAGE_CAPACITY;
    }

    addObjectToInventory(object, type) {
        if(this.isFull()) {
            return;
        }

        const objectContainer = {
            type,
            id: utility.genId(),
            content: object
        };
        this.datastoreObject.objects.push(objectContainer);
        return objectContainer;
    }

    dropObjectFromInventory(objectId) {
        const objects = this.datastoreObject.objects;
        const objectIndex = objects.findIndex(element => element.id === objectId);
        
        if(objectIndex === -1) {
            return;
        }

        const droppedObject = objects[objectIndex];
        objects.splice(objectIndex, 1);
        return droppedObject;
    }
}

module.exports = {InventoryPage};