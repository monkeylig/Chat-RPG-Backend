
class IBackendDataSource {
    async initializeDataSource(options) {
        console.log("backend initializeDataSource()");
    }

    //#region Gen3 interface
    collection(name) {
        return new IBackendDataSourceCollectionRef();
    }

    async runTransaction(transactionFunction) {
        console.log("backend runTransaction()");
    }
    //#endregion

    //#region Gen2
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
         *  $set: {
         *      fieldName: newValue,
         *      fieldName: newValue,
         *      ...
         *  },
         *  $push: {
         *      fieldName: newValue,
         *      fieldName: newValue,
         *      ...
         *  }, 
         * }
         */
        console.log("backend updateDocumentInCollection()");
    }
    //#endregion
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
        if(updateDoc.hasOwnProperty('$set')) {
            const setFields = updateDoc['$set'];
            for(const field in setFields) {
                document[field] = setFields[field];
            }
        }

        if(updateDoc.hasOwnProperty('$push')) {
            const pushFields = updateDoc['$push'];
            for(const field in pushFields) {
                if(!document.hasOwnProperty(field)) {
                    document[field] = [];
                }
                for(const item of pushFields[field]) {
                    document[field].push(item);
                }
            }
        }

        if(updateDoc.hasOwnProperty('$pull')) {
            for(const property in updateDoc['$pull']) {
                for(let i = document[property].length - 1; i >= 0; i--) {
                    for(let c = 0; c < updateDoc['$pull'][property].length; c++) {
                        if(document[property][i] == updateDoc['$pull'][property][c]) {
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

class IBackendDataSourceCollectionRef {
    async add(object) {
        console.log("backend add()");
        return new IBackendDataSourceDocumentRef();
    }

    doc(path) {
        return new IBackendDataSourceDocumentRef();
    }

    where(field, opStr, value) {
        return new IBackendDataSourceQuery();
    }
}

class IBackendDataSourceDocumentRef {
    id;
    async get() {
        console.log("backend get()");
        return new IBackendDataSourceDocumentSnapshot();
    }

    async set(object) {
        console.log("backend set()");
    }

    async update(object) {
        console.log("backend update()");
    }

    async delete() {
        console.log("backend delete()");
    }
}

class IBackendDataSourceDocumentSnapshot {
    exists;
    ref;
    data() {}
}

class IBackendDataSourceQuery {
    async get() {
        console.log("backend query get()");
        return new IBackendDataSourceQuerySnapShot();
    }
}

class IBackendDataSourceQuerySnapShot {
    empty;
    docs;
    forEach(callback){}
}

class IBackendDataSourceTransaction {
    async get(refOrQuery){}
    create(documentRef, data){}
    update(documentRef, updateObject){}
}

class FieldValue {
    static Arraytype = "array";
    static UnionOp = "union";
    static RemoveOp = "remove";
    fieldType;
    arrayOp;
    arrayElements;
    
    static arrayUnion(...elements) {
        const fieldValue = new FieldValue();
        fieldValue.fieldType = this.Arraytype;
        fieldValue.arrayOp = this.UnionOp;
        fieldValue.arrayElements = elements;
        return fieldValue;
    }

    static arrayRemove(...elements) {
        const fieldValue = new FieldValue();
        fieldValue.fieldType = this.Arraytype;
        fieldValue.arrayOp = this.RemoveOp;
        fieldValue.arrayElements = elements;
        return fieldValue;
    }
}

module.exports = {IBackendDataSource, FieldValue};