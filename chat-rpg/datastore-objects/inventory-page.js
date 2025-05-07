/**
 * @import {CollectionContainer} from './utilities'
 * @import {Player} from './agent'
 */

const DatastoreObject = require('./datastore-object');
const { addObjectToCollection, dropObjectFromCollection, findObjectInCollection} = require('./utilities');

/**
 * @typedef {Object} InventoryPageData
 * @property {CollectionContainer[]} objects
 */

class InventoryPage extends DatastoreObject {
    static PAGE_CAPACITY = 25;

    /**
     * 
     * @param {Object} [objectData] 
     * @param {string} [pageId] 
     * @param {Player} [player] 
     */
    constructor(objectData, pageId, player) {
        super(objectData);
        this.pageId = pageId;
        this.player = player;
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

    /**
     * 
     * @param {Object} object 
     * @param {string} type 
     * @returns {CollectionContainer | undefined}
     */
    addObjectToInventory(object, type) {
        const inventoryObjects = this.getData().objects;
        const oldLength = inventoryObjects.length;
        const container = addObjectToCollection(inventoryObjects, object, type, InventoryPage.PAGE_CAPACITY);

        if (oldLength != inventoryObjects.length && this.pageId && this.player) {
            this.player.onObjectAddedToInventory(this.pageId);
        }

        return container
    }

    /**
     * 
     * @param {string} objectId 
     * @returns {CollectionContainer | undefined}
     */
    dropObjectFromInventory(objectId) {
        const inventoryObjects = this.getData().objects;
        const oldLength = inventoryObjects.length;
        const container = dropObjectFromCollection(inventoryObjects, objectId);

        if (oldLength != inventoryObjects.length && this.pageId && this.player) {
            this.player.onObjectRemovedFromInventory(this.pageId);
        }

        return container;
    }

    /**
     * 
     * @param {string} objectId 
     * @returns {CollectionContainer | undefined}
     */
    findObjectById(objectId) {
        return findObjectInCollection(this.datastoreObject.objects, objectId);
    }
}

module.exports = {InventoryPage};