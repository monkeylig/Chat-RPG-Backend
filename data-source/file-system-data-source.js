const fs = require('fs/promises');
const IBackendDataSource = require("./backend-data-source")

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
            fileHandle = await fs.open(this.#dataSourcePath, 'r');
            let fileContent = await fileHandle.readFile({encoding: 'UTF8'});
            if(fileContent != '')
            {
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