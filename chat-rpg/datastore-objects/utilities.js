const utility = require("../../utility");
const chatRPGUtility = require('../utility');

function addObjectToCollection(collection, object, type, limit) {
    if(limit && collection.length >= limit) {
        return;
    }

    if(type === 'item') {
        const itemObject = findObjectInCollectionByName(collection, object.name);
        if(itemObject) {
            itemObject.content.count += object.count;
            return itemObject;
        }
    }

    const objectContainer = {
        type,
        id: utility.genId(),
        content: object
    };
    collection.push(objectContainer);
    return objectContainer;
}

function dropObjectFromCollection(collection, id) {
    const objectIndex = collection.findIndex(element => element.id === id);

    if(objectIndex === -1) {
        return;
    }

     const objectData = collection.splice(objectIndex, 1);

    return objectData[0];
}

function findObjectInCollection(collection, id) {
    const object = chatRPGUtility.findInObjectArray(collection, 'id', id);
    
    if (!object) {
        return;
    }
    return object;
}

function findObjectInCollectionByName(collection, name) {
    return collection.find((object) => object.content.name === name);
}

module.exports = {
    gameColection: {
        addObjectToCollection,
        dropObjectFromCollection,
        findObjectInCollection,
        findObjectInCollectionByName
    }
};