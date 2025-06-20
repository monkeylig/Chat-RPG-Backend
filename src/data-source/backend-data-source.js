/**
 * @callback TransactionFunction
 * @param {IBackendDataSourceTransaction} transaction
 * @returns {any}
 */

const { deepCopy } = require("../utility");

/** An abstract class providing an interface to NoSQL datastore */
class IBackendDataSource {
    constructor() {
        /**@type {BackendDatabaseProcessorManager} */
        this.processorManager = new BackendDatabaseProcessorManager();
    }
    /**
     * 
     * @param {Object} options 
     * @returns {Promise<any>}
     */
    async initializeDataSource(options) {
        console.log("backend initializeDataSource()");
    }

    /**
     * 
     * @param {string} name 
     * @returns 
     */
    collection(name) {
        return new IBackendDataSourceCollectionRef(name, this.processorManager);
    }

    /**
    * @param {TransactionFunction} transactionFunction 
    * @returns {Promise<any>}
    */
    async runTransaction(transactionFunction) {
        console.log("backend runTransaction()");
    }

    /**
     * 
     * @param {BackendDatabaseProcessor} processor 
     */
    addProcessor(processor) {
        this.processorManager.addProcessor(processor);
    }
    /**
     * Remove a processor from the list of processors
     * @param {BackendDatabaseProcessor} processor 
     */
    removeProcessor(processor) {
        this.processorManager.removeProcessor(processor);
    }

    /**
     * 
     * @param {number} [value] 
     * @returns {any}
     */
    timestamp(value) {
        if (value) {
            return new Date(value);
        }
        return new Date(); // Return current time if no value is provided
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
    /**
     * 
     * @param {string} name 
     * @param {BackendDatabaseProcessorManager} processorManager 
     */
    constructor(name, processorManager) {
        /**@type {string} */
        this.name = name;
        /**@type {BackendDatabaseProcessorManager} */
        this.processorManager = processorManager;

    }
    /**
     * 
     * @param {Object} object 
     * @returns {Promise<IBackendDataSourceDocumentRef>}
     */
    async add(object) {
        this.processorManager.onWrite(this, undefined, object, "add");
        return this._add(object);
    }

    /**
     * 
     * @param {Object} object 
     * @returns {Promise<IBackendDataSourceDocumentRef>}
     */
    async _add(object) {
        console.log("backend add()");
        return new IBackendDataSourceDocumentRef(this);
    }

    /**
     * 
     * @param {string} [path] 
     * @returns {IBackendDataSourceDocumentRef}
     */
    doc(path) {
        return new IBackendDataSourceDocumentRef(this);
    }

    /**
     * 
     * @param {string} field 
     * @param {string} opStr 
     * @param {any} value 
     * @returns {IBackendDataSourceQuery}
     */
    where(field, opStr, value) {
        return new IBackendDataSourceQuery(this);
    }

    /**
     * @returns {IBackendDataSourceAggregateQuery}
     */
    count() {
        return new IBackendDataSourceAggregateQuery();
    }
}

class IBackendDataSourceDocumentRef {
    /**
     * 
     * @param {IBackendDataSourceCollectionRef} parent 
     */
    constructor (parent) {
        /**@type {string} */
        this.id = '';
        /**@type {BackendDatabaseProcessorManager} */
        this.processorManager = parent.processorManager;
        /**@type {IBackendDataSourceCollectionRef} */
        this.parent = parent;
    }

    /**
     * 
     * @returns {Promise<IBackendDataSourceDocumentSnapshot>}
     */
    async get() {
        const docSnap = await this._get();
        this.processorManager.onRead(this.parent, this, docSnap._data, "get");
        return docSnap;
    }

    /**
     * 
     * @returns {Promise<IBackendDataSourceDocumentSnapshot>}
     */
    async _get() {
        console.log("backend get()");
        return new IBackendDataSourceDocumentSnapshot(this);
    }

    /**
     * 
     * @param {Object} object
     * @returns {Promise<any>} 
     */
    async set(object) {
        this.processorManager.onWrite(this.parent, this, object, "set");
        return this._set(object);
    }

    /**
     * 
     * @param {Object} object
     * @returns {Promise<any>} 
     */
    async _set(object) {
        console.log("backend set()");
    }

    /**
     * 
     * @param {Object} object
     * @returns {Promise<any>} 
     */
    async update(object) {
        this.processorManager.onWrite(this.parent, this, object, "update");
        return this._update(object);
    }

    /**
     * 
     * @param {Object} object
     * @returns {Promise<any>} 
     */
    async _update(object) {
        console.log("backend update()");
    }

    /**
     * @returns {Promise<any>}
     */
    async delete() {
        console.log("backend delete()");
    }
}

class IBackendDataSourceDocumentSnapshot {
    /**
     * 
     * @param {IBackendDataSourceDocumentRef} ref 
     * @param {Object} [data] 
     */
    constructor(ref, data) {
        /**@type {IBackendDataSourceDocumentRef} */
        this.ref = ref;
        /**@type {boolean} */
        this.exists = data !== undefined;
        /**@type {Object | undefined} */
        this._data = this.exists ? deepCopy(data) : undefined;
    }

    /**
     * @returns {Object | undefined} The data that was retrieved from the datastore. 
     */
    data() {
         if (this.exists) {
            return deepCopy(this._data);
        }

        return;
    }
}

class IBackendDataSourceQuery {
    /**
     * 
     * @param {IBackendDataSourceCollectionRef} parent 
     */
    constructor(parent) {
        /**@type {IBackendDataSourceCollectionRef} */
        this.parent = parent;
        /**@type {BackendDatabaseProcessorManager} */
        this.processorManager = parent.processorManager;
    }
    /**
     * 
     * @returns {Promise<IBackendDataSourceQuerySnapShot>}
     */
    async get() {
        console.log("backend query get()");
        return new IBackendDataSourceQuerySnapShot();
    }

    /**
     * @returns {IBackendDataSourceAggregateQuery}
     */
    count() {
        return new IBackendDataSourceAggregateQuery();
    }
}

class IBackendDataSourceQuerySnapShot {
    constructor() {
        /**@type {boolean} */
        this.empty = true;
        /**@type {IBackendDataSourceDocumentSnapshot[]} */
        this.docs = [];
    }

    /**
     * 
     * @param {(element: IBackendDataSourceDocumentSnapshot) => void} callback 
     */
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

/**
 * Object used to perform transaction operations
 */
class IBackendDataSourceTransaction {
    /**
     * 
     * @param {BackendDatabaseProcessorManager} processorManager 
     */
    constructor(processorManager) {
        /**@type {BackendDatabaseProcessorManager} */
        this.processorManager = processorManager;
    }
    
    /**
     * @overload
     * @param {IBackendDataSourceDocumentRef} refOrQuery
     * @returns {Promise<IBackendDataSourceDocumentSnapshot>}
     */
    /**
     * @overload
     * @param {IBackendDataSourceQuery} refOrQuery
     * @returns {Promise<IBackendDataSourceQuerySnapShot>}
     */
    /**
     * 
     * @param {IBackendDataSourceDocumentRef | IBackendDataSourceQuery} refOrQuery 
     * @returns {Promise<IBackendDataSourceDocumentSnapshot | IBackendDataSourceQuerySnapShot>}
     */
    async get(refOrQuery) {
        const snap = await this._get(refOrQuery);
        if (snap instanceof IBackendDataSourceDocumentSnapshot && refOrQuery instanceof IBackendDataSourceDocumentRef) {
            this.processorManager.onRead(refOrQuery.parent, refOrQuery, snap.data(), "get");
        }
        return snap;
    }

    /**
     * 
     * @param {IBackendDataSourceDocumentRef | IBackendDataSourceQuery} refOrQuery 
     * @returns {Promise<IBackendDataSourceDocumentSnapshot | IBackendDataSourceQuerySnapShot>}
     */
    async _get(refOrQuery) {
        return refOrQuery.get();
    }

    /**
     * 
     * @param {IBackendDataSourceDocumentRef} documentRef 
     * @param {Object} data 
     */
    create(documentRef, data) {
        this.processorManager.onWrite(documentRef.parent, documentRef, data, "create");
        return this._create(documentRef, data);
    }

    /**
     * 
     * @param {IBackendDataSourceDocumentRef} documentRef 
     * @param {Object} data 
     */
    _create(documentRef, data){}

    /**
     * 
     * @param {IBackendDataSourceDocumentRef} documentRef 
     * @param {Object} data 
     */
    set(documentRef, data) {
        this.processorManager.onWrite(documentRef.parent, documentRef, data, "set");
        return this._set(documentRef, data);
    }

    /**
     * 
     * @param {IBackendDataSourceDocumentRef} documentRef 
     * @param {Object} data 
     */
    _set(documentRef, data){}

    /**
     * 
     * @param {IBackendDataSourceDocumentRef} documentRef 
     * @param {Object} updateObject 
     */
    update(documentRef, updateObject) {
        this.processorManager.onWrite(documentRef.parent, documentRef, updateObject, "update");
        return this._update(documentRef, updateObject);
    }

    /**
     * 
     * @param {IBackendDataSourceDocumentRef} documentRef 
     * @param {Object} updateObject 
     */
    _update(documentRef, updateObject){}
}

class FieldValue {
    static ArrayType = "array";
    static Timestamp = "$timestamp$";
    static UnionOp = "union";
    static RemoveOp = "remove";
    fieldType;
    arrayOp;
    arrayElements;
    
    static arrayUnion(...elements) {
        const fieldValue = new FieldValue();
        fieldValue.fieldType = this.ArrayType;
        fieldValue.arrayOp = this.UnionOp;
        fieldValue.arrayElements = elements;
        return fieldValue;
    }

    static arrayRemove(...elements) {
        const fieldValue = new FieldValue();
        fieldValue.fieldType = this.ArrayType;
        fieldValue.arrayOp = this.RemoveOp;
        fieldValue.arrayElements = elements;
        return fieldValue;
    }
}

class BackendDatabaseProcessorManager {
    constructor() {
        /**@type {BackendDatabaseProcessor[]} */
        this.processors = [];
    }
    /**
     * 
     * @param {BackendDatabaseProcessor} processor 
     */
    addProcessor(processor) {
        this.processors.push(processor);
    }
    /**
     * 
     * @param {BackendDatabaseProcessor} processor 
     */
    removeProcessor(processor) {
        const index = this.processors.indexOf(processor);
        if(index !== -1) {
            this.processors.splice(index, 1);
        }
    }
    /**
     * 
     * @param {IBackendDataSourceCollectionRef} collectionRef 
     * @param {IBackendDataSourceDocumentRef} documentRef 
     * @param {Object} data 
     * @param {string} method 
     */
    onRead(collectionRef, documentRef, data, method) {
        for(const processor of this.processors) {
            processor.onRead(collectionRef, documentRef, data, method);
        }
    }
    /**
     * 
     * @param {IBackendDataSourceCollectionRef} collectionRef 
     * @param {IBackendDataSourceDocumentRef | undefined} documentRef 
     * @param {Object} data 
     * @param {string} method 
     */
    onWrite(collectionRef, documentRef, data, method) {
        for(const processor of this.processors) {
            processor.onWrite(collectionRef, documentRef, data, method);
        }
    }    
}

class BackendDatabaseProcessor {
    /**
     * An event that is called when a document is read or written to the database. This is called before the data to returned to the user.
     * @param {IBackendDataSourceCollectionRef} collectionRef 
     * @param {IBackendDataSourceDocumentRef} documentRef 
     * @param {Object} data 
     * @param {string} method 
     */
    onRead(collectionRef, documentRef, data, method) {
        
    }

    /**
     * An event that is called when a document is written to the database. This is called before the data is written to the document.
     * @param {IBackendDataSourceCollectionRef} collectionRef 
     * @param {IBackendDataSourceDocumentRef | undefined} documentRef 
     * @param {Object} data 
     * @param {string} method 
     */
    onWrite(collectionRef, documentRef, data, method) {
        
    }
}

class Timestamp {
    /**
     * 
     * @param {number} value 
     * @returns {any}
     */
    fromMilliseconds(value) {
        return new Date(value);
    }
}

module.exports = {
    IBackendDataSource,
    IBackendDataSourceCollectionRef,
    IBackendDataSourceDocumentRef,
    IBackendDataSourceAggregateQuery,
    IBackendDataSourceAggregateQuerySnapShot,
    IBackendDataSourceDocumentSnapshot,
    IBackendDataSourceQuery,
    IBackendDataSourceQuerySnapShot,
    IBackendDataSourceTransaction,
    FieldValue,
    BackendDatabaseProcessorManager,
    BackendDatabaseProcessor,
    Timestamp
};
