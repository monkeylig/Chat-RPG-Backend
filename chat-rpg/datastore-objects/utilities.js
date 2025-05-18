const utility = require("../../utility");
const chatRPGUtility = require('../utility');

/** 
 * @typedef {new (...args: any[]) => {}} Constructor
 */

/**
 * @typedef {Object} CollectionContainer
 * @property {string} type
 * @property {string} id
 * @property {Object} content
 */

/**
 * @typedef {CollectionContainer[]} Collection
 */

/**
 * 
 * @param {Object} object 
 * @returns {boolean}
 */
function isStackable(object) {
    return object.count != undefined && typeof object.count === 'number';
}

/**
 * Adds an object to the container.
 * 
 * @param {Collection} collection - The collection to store the object in.
 * @param {Object} object - The object to be stored.
 * @param {string} type - The label of this object.
 * @param {number} [limit] - The number of objects this collection can hold.
 * @returns {CollectionContainer | undefined} The new object that was added.
 */
function addObjectToCollection(collection, object, type, limit) {
    if(isStackable(object)) { // Don't like that this is checked here
        const itemObject = findObjectInCollectionByName(collection, object.name);
        if(itemObject) {
            itemObject.content.count += object.count;
            return itemObject;
        }
    }

    if(limit && collection.length >= limit) {
        return;
    }

    const objectContainer = {
        type,
        id: utility.genId(),
        content: object
    };
    collection.push(objectContainer);
    return objectContainer;
}

/**
 * Removes an Object from the container.
 * 
 * @param {Collection} collection - The collection that the object is stored in.
 * @param {string} id - The id of the object
 * @param {{count?: number}} [options] - additional options {count: number - Affects stackable objects, the number to remove from the collection}
 * @returns {CollectionContainer | undefined} - The object that was removed
 */
function dropObjectFromCollection(collection, id, options={}) {
    const objectIndex = collection.findIndex(element => element.id === id);

    if(objectIndex === -1) {
        return;
    }

    const targetObject = collection[objectIndex];
    
    if (isStackable(targetObject.content) && options.count) {
        targetObject.content.count -= options.count;
        if (targetObject.content.count > 0) {
            return targetObject;
        }
    }

    const objectData = collection.splice(objectIndex, 1);

    return objectData[0];
}

/**
 * Find an object inside the container
 * 
 * @param {Collection} collection - The collection that the object is stored in.
 * @param {string} id - The id of the object
 * @returns {CollectionContainer | undefined} The found object or undefined
 */
function findObjectInCollection(collection, id) {
    const object = chatRPGUtility.findInObjectArray(collection, 'id', id);
    
    if (!object) {
        return;
    }
    return object;
}

/**
 * 
 * @param {Collection} collection - The collection that the object is stored in.
 * @param {string} name - The name of the object. 
 * @returns {CollectionContainer | undefined} The found object or undefined
 */
function findObjectInCollectionByName(collection, name) {
    return collection.find((object) => object.content.name === name);
}

class GameCollection {
    /**
     * 
     * @param {Collection} collection 
     */
    constructor(collection) {
        this.collection = collection;
    }

    /**
     * Find an object inside the container
     * 
     * @param {string} id - The id of the object
     * @returns {CollectionContainer | undefined} The found object or undefined
     */
    findObjectById(id) {
        return findObjectInCollection(this.collection, id);
    }
    
    /**
     * Adds an object to the container.
     * 
     * @param {Object} object - The object to be stored.
     * @param {string} type - The label of this object.
     * @param {number} [limit] - The number of objects this collection can hold.
     * @returns {CollectionContainer | undefined} The new object that was added.
     */
    addObject(object, type, limit) {
        return addObjectToCollection(this.collection, object, type, limit);
    }

    /**
     * Removes an Object from the container.
     * 
     * @param {string} id - The id of the object
     * @param {{count?: number}} [options] - additional options {count: number - Affects stackable objects, the number to remove from the collection}
     * @returns {CollectionContainer | undefined} - The object that was removed
     */
    dropObject(id, options={}) {
        return dropObjectFromCollection(this.collection, id, options);
    }
}

/**
 * @module chat-rpg/datastore-objects/utilities
 */
module.exports = {
    addObjectToCollection,
    dropObjectFromCollection,
    findObjectInCollection,
    findObjectInCollectionByName,
    GameCollection
};