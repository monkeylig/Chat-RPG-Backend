const utility = require("../../utility");

class DatastoreObject {
    datastoreObject;
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

    constructNewObject(object) {
        throw "constructNewObject() is not implemented";
    }

    setData(property, value) {
        this.datastoreObject[property] = value;
    }

    getData() {
        return this.datastoreObject;
    }

    resetData(data) {
        this.datastoreObject = data;
    }
}

module.exports = DatastoreObject;