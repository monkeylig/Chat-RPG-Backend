const utility = require("../../utility");
const chatRPGUtility = require('../utility');

/** 
 * @typedef {new (...args: any[]) => {}} Constructor
 */

/**
 * @template {Object} T
 * 
 * @typedef {Object} CollectionContainer
 * @property {string} type
 * @property {string} id
 * @property {T} content
 */

/**
 * @template {Object} T
 * @typedef {CollectionContainer<T>[]} Collection
 */

/**
 * @typedef {Object} Stackable
 * @property {number} count
 * @property {string} name
 */

/**
 * 
 * @param {Object} [object] 
 * @returns {object is Stackable}
 */
function isStackable(object) {
    return (
        object &&
        object.count != undefined && typeof object.count === 'number' &&
        object.name && typeof object.name === 'string');
}

/**
 * 
 * @template {Object} T
 * @param {T} object 
 * @param {string} type 
 * @returns {CollectionContainer<T>}
 */
function newObjectContainer(object, type) {
    return {
        type,
        id: utility.genId(),
        content: object
    };
}

/**
 * Adds an object to the container.
 * 
 * @template {Object} T
 * @param {Collection<T>} collection - The collection to store the object in.
 * @param {Object} object - The object to be stored.
 * @param {string} type - The label of this object.
 * @param {number} [limit] - The number of objects this collection can hold.
 * @returns {CollectionContainer<T> | undefined} The new object that was added.
 */
function addObjectToCollection(collection, object, type, limit) {
    if(isStackable(object)) {
        const itemObject = findObjectInCollectionByName(collection, object.name);
        if(itemObject && isStackable(itemObject.content)) {
            itemObject.content.count += object.count;
            return itemObject;
        }
    }

    if(limit && collection.length >= limit) {
        return;
    }

    const objectContainer = newObjectContainer(object, type);
    collection.push(objectContainer);
    return objectContainer;
}

/**
 * Removes an Object from the container.
 * 
 * @template {Object} T
 * @param {Collection<T>} collection - The collection that the object is stored in.
 * @param {string} id - The id of the object
 * @param {{count?: number}} [options] - additional options {count: number - Affects stackable objects, the number to remove from the collection}
 * @returns {CollectionContainer<T> | undefined} - The object that was removed
 */
function dropObjectFromCollection(collection, id, options={}) {
    const objectIndex = findObjectIndex(collection, id);

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
 * 
 * @template {Object} T
 * @param {Collection<T>} collection 
 * @param {string} id 
 * @param {Object} object 
 * @param {string} type 
 */
function replaceObject(collection, id, object, type) {
    const objectIndex = findObjectIndex(collection, id);

    if(objectIndex === -1) {
        return;
    }

    collection[objectIndex] = newObjectContainer(object, type);
    return collection[objectIndex];
}

/**
 * 
 * @template {Object} T
 * @param {Collection<T>} collection 
 * @param {string} id 
 */
function findObjectIndex(collection, id) {
    return collection.findIndex(element => element.id === id);
}

/**
 * Find an object inside the container
 * 
 * @template {Object} T
 * @param {Collection<T>} collection - The collection that the object is stored in.
 * @param {string} id - The id of the object
 * @returns {CollectionContainer<T> | undefined} The found object or undefined
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
 * @template {Object} T
 * @param {Collection<T>} collection - The collection that the object is stored in.
 * @param {string} name - The name of the object. 
 * @returns {CollectionContainer<T> | undefined} The found object or undefined
 */
function findObjectInCollectionByName(collection, name) {
    return collection.find((object) => {
            const content = /**@type {{name?: string}}*/(object.content);
            return content.name === name;
        }
    );
}

/**
 * @template {Object} T
 */
class GameCollection {
    /**
     * 
     * @param {Collection<T>} collection 
     * @param {string} [itemType='default'] 
     */
    constructor(collection, itemType = 'default') {
        this.collection = collection;
        this.defaultItemType = itemType;
    }

    /**
     * Find an object inside the container
     * 
     * @param {string} id - The id of the object
     * @returns {CollectionContainer<T> | undefined} The found object or undefined
     */
    findObjectById(id) {
        return findObjectInCollection(this.collection, id);
    }

    /**
     * 
     * @param {string} name 
     */
    findObjectByName(name) {
        return findObjectInCollectionByName(this.collection, name);
    }
    
    /**
     * Adds an object to the container.
     * 
     * @param {Object} object - The object to be stored.
     * @param {string} [type] - The label of this object.
     * @param {number} [limit] - The number of objects this collection can hold.
     * @returns {CollectionContainer<T> | undefined} The new object that was added.
     */
    addObject(object, type=this.defaultItemType, limit) {
        return addObjectToCollection(this.collection, object, type, limit);
    }

    /**
     * 
     * @param {string} id 
     * @param {Object} object 
     * @param {string} type 
     */
    replaceObject(id, object, type=this.defaultItemType) {
        return replaceObject(this.collection, id, object, type);
    }

    /**
     * Removes an Object from the container.
     * 
     * @param {string} id - The id of the object
     * @param {{count?: number}} [options] - additional options {count: number - Affects stackable objects, the number to remove from the collection}
     * @returns {CollectionContainer<T> | undefined} - The object that was removed
     */
    dropObject(id, options={}) {
        return dropObjectFromCollection(this.collection, id, options);
    }
    get length() {
        return this.collection.length;
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
    replaceObject,
    GameCollection
};