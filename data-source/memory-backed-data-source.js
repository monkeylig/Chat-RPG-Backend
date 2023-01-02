const fs = require('fs/promises');
const IBackendDataSource = require("./backend-data-source")

/**
 * Data Source structure
 * {
 *  starting_avatars: ['avatar-filename'(string), 'avatar-filename'(string), 'avatar-filename'(string)]
 * }
 */
function genId() {
    return Math.floor(Math.random() * 10000000);
}

class MemoryBackedDataSource extends IBackendDataSource {
    dataSource;

    constructor() {
        super();
        this.dataSource = {};
    }

    async initializeDataSource(initialData={})
    {
        this.dataSource = initialData;

        if(!this.dataSource.hasOwnProperty("accounts"))
        {
            this.dataSource["accounts"] = [];
        }

        if(!this.dataSource.hasOwnProperty("starting_avatars"))
        {
            this.dataSource["starting_avatars"] = [];
        }
    }

    async addDocumentToCollection(document, collection) {
        this.verifyCollection(collection);

        document._id = genId();
        this.dataSource[collection].push(document);

        return document;
    }

    async getCollection(collection) {
        this.verifyCollection(collection);

        return this.dataSource[collection];
    }

    async findDocumentInCollection(value, macher, collection) {
        this.verifyCollection(collection);

        const collectionObj = this.dataSource[collection];
        for(let i = 0; i < collectionObj.length; i++) {
            if(collectionObj[i][macher] === value) {
                return collectionObj[i];
            }
        }
        return {};
    }

    verifyCollection(collection) {
        if(!this.dataSource.hasOwnProperty(collection)) {
            this.dataSource[collection] = [];
        }
    }

    //#region Legacy Interface
    async getStartingAvatars() {
        const avatars = this.dataSource["starting_avatars"];
        if (avatars.length == 0)
        {
            return {};
        }
        return avatars;
    }

    async addAccount(obj) {
        this.dataSource["accounts"].push(obj);
    }
    //#endregion
}

module.exports = MemoryBackedDataSource;