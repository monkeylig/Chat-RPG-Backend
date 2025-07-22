/**
 * @import {CollectionContainer} from './utilities'
 * @import {Player} from './agent'
 * @import {Collection} from './utilities'
 */

const DatastoreObject = require('./datastore-object');
const { GameCollection} = require('./utilities');

/**
 * @typedef {Object} InventoryPageData
 * @property {CollectionContainer<Object>[]} objects
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
        this.pageCollection = new PageCollection(this.getData().objects, pageId, player);
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

    getPage() {
        return this.pageCollection;
    }

    isFull() {
        return this.datastoreObject.objects.length >= InventoryPage.PAGE_CAPACITY;
    }

    /**
     * 
     * @param {Object} object - The object to be stored.
     * @param {string} type - The label of this object.
     * @returns {CollectionContainer<Object> | undefined}
     */
    addObjectToInventory(object, type) {
        return this.pageCollection.addObject(object, type, InventoryPage.PAGE_CAPACITY);
    }

    /**
     * 
     * @param {string} objectId - The id of the object
     * @param {{count?: number}} [options] - additional options {count: number - Affects stackable objects, the number to remove from the collection}
     * @returns {CollectionContainer<Object> | undefined}
     */
    dropObjectFromInventory(objectId, options) {
        return this.pageCollection.dropObject(objectId, options);
    }

    /**
     * 
     * @param {string} objectId 
     * @returns {CollectionContainer<Object> | undefined}
     */
    findObjectById(objectId) {
        return this.pageCollection.findObjectById(objectId);
    }
}

class PageCollection extends GameCollection {
    /**
     * 
     * @param {Collection<Object>} collection
     * @param {string} [pageId] 
     * @param {Player} [player] 
     */
    constructor(collection, pageId, player) {
        super(collection);
        this.pageId = pageId;
        this.player = player;
    }

    /**
     * Adds an object to the container.
     * 
     * @override
     * @param {Object} object - The object to be stored.
     * @param {string} type - The label of this object.
     * @param {number} [limit] - The number of objects this collection can hold.
     * @returns {CollectionContainer<Object> | undefined} The new object that was added.
     */
    addObject(object, type, limit) {
        const inventoryObjects = this.collection;
        const oldLength = inventoryObjects.length;
        const container = super.addObject(object, type, limit);

        if (oldLength != inventoryObjects.length && this.pageId && this.player) {
            this.player.onObjectAddedToInventory(this.pageId);
        }

        return container;
    }

    /**
     * @override
     * @param {string} objectId - The id of the object
     * @param {{count?: number}} [options] - additional options {count: number - Affects stackable objects, the number to remove from the collection}
     * @returns {CollectionContainer<Object> | undefined}
     */
    dropObject(objectId, options={}) {
        const inventoryObjects = this.collection;
        const oldLength = inventoryObjects.length;
        const container = super.dropObject(objectId, options);

        if (oldLength != inventoryObjects.length && this.pageId && this.player) {
            this.player.onObjectRemovedFromInventory(this.pageId);
        }

        return container;
    }
}

module.exports = {InventoryPage};