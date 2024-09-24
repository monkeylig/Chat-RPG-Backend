/** @import {AbilityData} from "./ability" */
const Ability = require("./ability");
const DatastoreObject = require('./datastore-object');

/**
 * @typedef {AbilityData & {
 * count: number,
 * icon: string,
 * outOfBattle: boolean
 * }} ItemData
 */

class Item extends DatastoreObject {
    constructor(objectData) {
        super(objectData);
    }

    constructNewObject(item) {
        Ability.constructNewObject(item)
        item.name = 'nothing';
        item.icon = 'potion.png';
        item.count = 1;
        item.instanceNumber = 0;
        item.outOfBattle = false;
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

    /**
     * @override
     * @returns {ItemData}
     */
    getData() {
        return /** @type {ItemData} */ (this.datastoreObject);
    }
}

module.exports = Item;