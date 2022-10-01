const fs = require('fs/promises');
const IBackendDataSource = require("./backend-data-source")

/**
 * Data Source structure
 * {
 *  starting_avatars: ['avatar-filename'(string), 'avatar-filename'(string), 'avatar-filename'(string)]
 * }
 */

class FileSystemDataSource extends IBackendDataSource {
    static defaultDataSourceFileName = './data-source.json';
    dataSource;

    #dataSourcePath;

    constructor() {
        super();
        this.dataSource = {};
    }

    async initializeDataSource(path)
    {
        if(path === undefined)
        {
            this.#dataSourcePath = FileSystemDataSource.defaultDataSourceFileName;
        }
        else {
            this.#dataSourcePath = path;
        }

        let fileHandle;
    
        try {
            fileHandle = await fs.open(this.#dataSourcePath, 'a+');
            let fileContent = await fileHandle.readFile({encoding: 'UTF8'});
            if(fileContent != '')
            {
                console.log("parcing data");
                this.dataSource = JSON.parse(fileContent);
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

        if(!this.dataSource.hasOwnProperty("accounts"))
        {
            this.dataSource["accounts"] = [];
        }
    }

    getStartingAvatars() {
        const avatars = this.dataSource["starting_avatars"];

        if(avatars){
            return avatars;
        }
        else {
            return {};
        }
    }

    async addAccount(obj) {
        this.dataSource["accounts"].push(obj);
        let fileHandle;
        try {
            fileHandle = await fs.open(this.#dataSourcePath, 'w');
            await fileHandle.writeFile(JSON.stringify(this.dataSource));
        } finally {
            fileHandle.close();
        }
    }
}

module.exports = FileSystemDataSource;