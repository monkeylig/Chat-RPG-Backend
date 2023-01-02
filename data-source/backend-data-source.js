
class IBackendDataSource {
    async initializeDataSource(options) {
        console.log("backend initializeDataSource()");
    }

    async addDocumentToCollection(document, collection) {
        console.log("backend addDocumentToCollection()");
    }

    async getCollection(collection) {
        console.log("backend getCollection()");
    }

    async findDocumentInCollection(value, macher, collection) {
        console.log("backend findDocumentInCollection()");
    }

    async updateDocumentInCollection(filter, updateDoc, collection) {
        /** updateDoc format
         * {
         *  add: [
         *      [fieldName, newValue],
         *      [fieldName, newValue],
         *      ...
         *  ],
         *  push: [
         *      [fieldName, newValue],
         *      [fieldName, newValue],
         *      ...
         *  ], 
         * }
         */
        console.log("backend updateDocumentInCollection()");
    }

    //#region datastore helper functions
    isPropertyMatch(filter, document) {
        for(const property in filter) {
            if(document[property] != filter[property] ) {
                return false;
            }
        }

        return true;
    }

    filterCollectionArray(filter, collectionObj) {
        const filterResult = [];
        for(const document of collectionObj) {
            if(this.isPropertyMatch(filter, document)) {
                filterResult.push(document);
            }
        }
        return filterResult;
    }

    applyUpdateDoc(updateDoc, document) {
        if(updateDoc.hasOwnProperty('set')) {
            const setFields = updateDoc.set;
            for(const field of setFields) {
                document[field[0]] = field[1];
            }
        }

        if(updateDoc.hasOwnProperty('push')) {
            const pushFields = updateDoc.push;
            for(const field of pushFields) {
                if(!document.hasOwnProperty(field[0])) {
                    document[field[0]] = [];
                }
                document[field[0]].push(field[1]);
            }
        }

        if(updateDoc.hasOwnProperty('pull')) {
            for(const property in updateDoc.pull) {
                for(let i = document[property].length - 1; i >= 0; i--) {
                    for(let c = 0; c < updateDoc.pull[property].length; c++) {
                        if(document[property][i] == updateDoc.pull[property][c]) {
                            document[property].splice(i, 1);
                            break;
                        }
                    }
                }
            }
        }
    }
    //#endregion
    
//#region legacy interface
    async getStartingAvatars() {
        console.log("backend getStartingAvatars()");
    }

    async addAccount(account) {
        console.log("backend addAccount()");
    }

    async findAccount(value, matcher) {
        console.log("backend findAccount()");
    }
//#endregion

}

module.exports = IBackendDataSource;