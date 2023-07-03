const DatastoreObject = require('./datastore-object');

class Item extends DatastoreObject {
    constructor(objectData) {
        super(objectData);
    }

    constructNewObject(item) {
        item.name = 'nothing';
        item.icon = 'potion.png';
        item.count = 1;
        item.effectName = '';
        item.heal = 0;
        item.description = 'A useful Item.'
    }

    isDepleted() {
        return Item.isDepleted(this.datastoreObject);
    }

    static isDepleted(datastoreObject) {
        return datastoreObject.count <= 0;
    }

    onUsed() {
        Item.onUsed(this.datastoreObject);
    }

    static onUsed(datastoreObject) {
        if(!Item.isDepleted(datastoreObject)) {
            datastoreObject.count -= 1;
        }
    }
}

module.exports = Item;