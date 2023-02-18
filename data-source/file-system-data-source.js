const fs = require('fs/promises');
const IBackendDataSource = require("./backend-data-source")

/**
 * Data Source structure
 * {
 *  starting_avatars: ['avatar-filename'(string), 'avatar-filename'(string), 'avatar-filename'(string)]
 *  accounts: [
 *              {name, twitchId, avatar, level}
 *            ]
 * }
 */
function genId() {
    return Math.floor(Math.random() * 10000000);
}

class FileSystemDataSource extends IBackendDataSource {
    static defaultDataSourceFileName = './data-source.json';

    #dataSourcePath;

    constructor() {
        super();
        this.#dataSourcePath = null;
    }

    async initializeDataSource(path)
    {
        await this.loadDataSource(path);
    }

    async addDocumentToCollection(document, collection) {
        const dataSource = await this.loadDataSource();

        await this.verifyCollection(dataSource, collection, false);

        document._id = genId();
        dataSource[collection].push(document);
        await this.dumpDataSource(dataSource);

        return document;
    }

    async getCollection(collection) {
        const dataSource = await this.loadDataSource();

        await this.verifyCollection(dataSource, collection);

        return dataSource[collection];
    }

    async findDocumentInCollection(value, macher, collection) {
        const dataSource = await this.loadDataSource();

        await this.verifyCollection(dataSource, collection);

        const collectionObj = dataSource[collection];
        for(let i = 0; i < collectionObj.length; i++) {
            if(collectionObj[i][macher] === value) {
                return collectionObj[i];
            }
        }
        return {};
    }

    async updateDocumentInCollection(filter, updateDoc, collection) {
        const dataSource = await this.loadDataSource();
        await this.verifyCollection(dataSource, collection);
        const collectionObj = dataSource[collection];

        const targetDocuments = this.filterCollectionArray(filter, collectionObj);

        for(const target of targetDocuments) {
            this.applyUpdateDoc(updateDoc, target);
        }

        await this.dumpDataSource(dataSource);
    }

    //#region legacy interface
    async getStartingAvatars() {
        let dataSource = await this.loadDataSource();
        const avatars = dataSource.starting_avatars;

        if(avatars){
            return avatars;
        }
        else {
            return {};
        }
    }

    async addAccount(obj) {
        let dataSource = await this.loadDataSource();
        dataSource.accounts.push(obj);
        await this.dumpDataSource(dataSource);
    }
    //#endregion

    async loadDataSource(path) {
        if(!this.#dataSourcePath)
        {
            if(path === undefined) {
                this.#dataSourcePath = FileSystemDataSource.defaultDataSourceFileName;
            }
            else {
                this.#dataSourcePath = path;
            }
        }

        let fileHandle;
        let dataSource = {};
        try {
            fileHandle = await fs.open(this.#dataSourcePath, 'a+');
            let fileContent = await fileHandle.readFile({encoding: 'UTF8'});
            if(fileContent != '')
            {
                dataSource = JSON.parse(fileContent);
            }
        } catch(error) {
            if (error.code == 'ENOENT')
            {
                console.log("No data source file found. One will be created.");
            }
            else {
                throw error;
            }
        } finally {
            await fileHandle?.close();
        }
        
        if(!dataSource.hasOwnProperty("accounts"))
        {
            dataSource["accounts"] = [];
        }

        return dataSource;
    }

    async dumpDataSource(dataSource) {
        let fileHandle;
        try {
            fileHandle = await fs.open(this.#dataSourcePath, 'w');
            await fileHandle.writeFile(JSON.stringify(dataSource));
        } finally {
            fileHandle.close();
        }
    }

    async verifyCollection(dataSource, collection, dumpSource = true) {
        if(!dataSource.hasOwnProperty(collection))
        {
            dataSource[collection] = [];
            if(dumpSource) {
                await this.dumpDataSource(dataSource);
            }
        }
    }
}

module.exports = FileSystemDataSource;