const fs = require('fs/promises');
const IBackendDataSource = require("./backend-data-source")

/**
 * Data Source structure
 * {
 *  starting_avatars: ['avatar-filename'(string), 'avatar-filename'(string), 'avatar-filename'(string)]
 * }
 */

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

    getStartingAvatars() {
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
}

module.exports = MemoryBackedDataSource;