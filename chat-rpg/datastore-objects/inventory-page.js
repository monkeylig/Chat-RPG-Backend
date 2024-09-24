/**
 * @import {CollectionContainer} from './utilities'
 */

const DatastoreObject = require('./datastore-object');
const utility = require("../../utility");
const { gameColection } = require('./utilities');

/**
 * @typedef {Object} InventoryPageData
 * @property {CollectionContainer[]} objects
 */

class InventoryPage extends DatastoreObject {
    static PAGE_CAPACITY = 25;

    constructor(objectData) {
        super(objectData);
    }

    constructNewObject(page) {
        page.objects = [];
    }

    /**
     * @override
     * @returns {InventoryPageData}
     */
    getData() {
        return /** @type {InventoryPageData} */ (this.datastoreObject);
    }

    isFull() {
        return this.datastoreObject.objects.length >= InventoryPage.PAGE_CAPACITY;
    }

    addObjectToInventory(object, type) {
        return gameColection.addObjectToCollection(this.datastoreObject.objects, object, type, InventoryPage.PAGE_CAPACITY);
    }

    dropObjectFromInventory(objectId) {
        const objects = this.datastoreObject.objects;
        return gameColection.dropObjectFromCollection(objects, objectId);
    }

    /**
     * 
     * @param {string} objectId 
     * @returns {CollectionContainer | undefined}
     */
    findObjectById(objectId) {
        return gameColection.findObjectInCollection(this.datastoreObject.objects, objectId);
    }
}

module.exports = {InventoryPage};