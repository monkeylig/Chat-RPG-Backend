/**
 * @import {GConstructor} from '../utility'
 * 
 */

const utility = require("../../utility");

/** 
 * @typedef {GConstructor<DatastoreObject>} DatastoreConstructor
 */

/** A class representing an object that is stored in a datastore. */
class DatastoreObject {
    /** The raw data of the datastore object.
     * @member {Object}
     */
    datastoreObject;

    /**
     * 
     * @param {Object} objectData - The initial data for the datastore object to point to. All fields that are not recognized will be stript away. The new datastore object will keep a copy on this object. 
     */
    constructor(objectData) {
        this.datastoreObject = {};
        if(objectData === undefined) {
            this.constructNewObject(this.datastoreObject);
        }
        else {
            objectData = utility.deepCopy(objectData);
            this.constructNewObject(this.datastoreObject);
            for(const property in this.datastoreObject) {
                if(objectData.hasOwnProperty(property)) {
                    this.datastoreObject[property] = objectData[property];
                }
            }
        }
    }

    /**
     * @abstract
     * @protected
     * @param {Object} object 
     */
    constructNewObject(object) {
        throw "constructNewObject() is not implemented";
    }

    /**
     * Set a property of the datastore object.
     * @param {string} property 
     * @param {*} value 
     */
    setData(property, value) {
        this.datastoreObject[property] = value;
    }

    /**
     * 
     * @returns {Object} - A reference to the raw datastore object.
     */
    getData() {
        return this.datastoreObject;
    }

    /**
     * Directly set the internal datastore object
     * @param {Object} data - The new data for the datastore objectS
     */
    resetData(data) {
        this.datastoreObject = data;
    }
}


/**
 * @module chat-rpg/datastore-objects/datastore-object
 */
module.exports = DatastoreObject;