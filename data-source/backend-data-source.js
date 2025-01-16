/**
 * @typedef {Object} Transaction
 * @property {(refOrQuery: *) => *} get
 * @property {(documentRef: *, data: *) => *} create
 * @property {(documentRef: *, data: *) => *} set
 * @property {(documentRef: *, updateObject: *) => *} update
 * 
 * @callback TransactionFunction
 * @param {Transaction} transaction
 * @returns {*}
 */

/** An abstract class providing an interface to NoSQL datastore */
class IBackendDataSource {
    async initializeDataSource(options) {
        console.log("backend initializeDataSource()");
    }

    //#region Gen3 interface
    collection(name) {
        return new IBackendDataSourceCollectionRef();
    }

    /**
    * @param {TransactionFunction} transactionFunction 
    * @returns {Promise}
    */
    async runTransaction(transactionFunction) {
        console.log("backend runTransaction()");
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

    /**
     * @returns {IBackendDataSourceAggregateQuery}
     */
    count() {
        return new IBackendDataSourceAggregateQuery();
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
    /**@type {IBackendDataSourceDocumentRef} */
    // @ts-ignore
    ref;
    /**
     * @returns {Object | undefined} The data that was retrieved from the datastore. 
     */
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

class IBackendDataSourceAggregateQuery {
    /**
     * 
     * @returns {Promise<IBackendDataSourceAggregateQuerySnapShot>}
     */
    async get() {
        console.log("backend query get()");
        return new IBackendDataSourceAggregateQuerySnapShot();
    }
}

class IBackendDataSourceAggregateQuerySnapShot {
    /**
     * @returns {{count: number}}
     */
    data(){
        return {
            count: 0
        };
    }
}

class IBackendDataSourceTransaction {
    async get(refOrQuery){}
    create(documentRef, data){}
    set(documentRef, data){}
    update(documentRef, updateObject){}
}

class FieldValue {
    static Arraytype = "array";
    static Timestamp = "$timestamp$";
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

module.exports = {
    IBackendDataSource,
    IBackendDataSourceCollectionRef,
    IBackendDataSourceDocumentRef,
    IBackendDataSourceAggregateQuery,
    IBackendDataSourceAggregateQuerySnapShot,
    FieldValue
};
