/**
 * @import {BackendDatabaseProcessorManager, TransactionFunction} from "./backend-data-source"
 */

const {IBackendDataSource, FieldValue, IBackendDataSourceAggregateQuery, IBackendDataSourceAggregateQuerySnapShot,
    IBackendDataSourceCollectionRef, IBackendDataSourceDocumentRef, IBackendDataSourceDocumentSnapshot,
    IBackendDataSourceQuery, IBackendDataSourceQuerySnapShot, IBackendDataSourceTransaction} = require("./backend-data-source")

const utility = require("../utility");

/**
 * Data Source structure
 * {
 *  starting_avatars: ['avatar-filename'(string), 'avatar-filename'(string), 'avatar-filename'(string)]
 * }
 */

function flattenObjectArray(array) {
    const newArray = [];

    array.forEach(element => {
        newArray.push(JSON.stringify(element));
    });

    return newArray;
}

class MemoryBackedDataSource extends IBackendDataSource {
    dataSource;

    constructor() {
        super();
        this.dataSource = {};
    }

    /**
     * 
     * @param {Object} initialData 
     */
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

    /**
     * 
     * @param {string} name 
     * @returns {MemoryDataSourceCollectionRef}
     */
    collection(name) {
        return new MemoryDataSourceCollectionRef(this.dataSource, name, this.processorManager);
    }

    /**
     * 
     * @param {TransactionFunction} transactionFunction 
     * @returns {Promise<any>}
     * @override
     */
    async runTransaction(transactionFunction) {
        return await transactionFunction(new MemoryDataSourceTransaction(this.processorManager));
    }
}

class MemoryDataSourceCollectionRef extends IBackendDataSourceCollectionRef {
    /**
     * 
     * @param {Object} dataSource 
     * @param {string} collectionName 
     * @param {BackendDatabaseProcessorManager} processorManager 
     */
    constructor(dataSource, collectionName, processorManager) {
        super(collectionName, processorManager);
        this.dataSource = dataSource;
    }

    /**
     * @override
     * @param {Object} object 
     */
    async _add(object) {
        this.verifyCollection();

        const id = utility.genId();
        this.dataSource[this.name][id] = Object.assign({}, object);
        return new MemoryDataSourceDocumentRef(id, this.dataSource[this.name], this);
    }

    /**
     * @override
     * @param {string} [path] 
     */
    doc(path) {
        this.verifyCollection();

        if(!path) {
            const id = utility.genId();
            return new MemoryDataSourceDocumentRef(id, this.dataSource[this.name], this);
        }

        return new MemoryDataSourceDocumentRef(path, this.dataSource[this.name], this);
    }

    /**
     * @override
     * @param {string} field 
     * @param {string} opStr 
     * @param {any} value 
     */
    where(field, opStr, value) {
        if(!this.collectionExists()) {
            return new MemoryDataSourceQuery(field, opStr, value, {}, this);
        }

        return new MemoryDataSourceQuery(field, opStr, value, this.dataSource[this.name], this);
    }
    
    verifyCollection() {
        if(!this.collectionExists()) {
            this.dataSource[this.name] = {};
        }
    }

    collectionExists() {
        return this.dataSource.hasOwnProperty(this.name);
    }

    /**
     * @override
     */
    count() {
        return new MemoryDataSourceAggregateQuery(this);
    }
}

class MemoryDataSourceAggregateQuery extends IBackendDataSourceAggregateQuery {
    /**
     * 
     * @param {MemoryDataSourceCollectionRef} ref 
     */
    constructor(ref) {
        super();
        this.ref = ref;
    }
    /**
     * 
     * @returns {Promise<MemoryDataSourceAggregateQuerySnapShot>}
     */
    async get() {
        let count = 0;
        for (const doc in this.ref.dataSource[this.ref.name]) {
            count += 1;
        }
        return new MemoryDataSourceAggregateQuerySnapShot({count});
    }
}

class MemoryDataSourceAggregateQuerySnapShot extends IBackendDataSourceAggregateQuerySnapShot {
    /**
     * 
     * @param {{count: number}} results 
     */
    constructor(results) {
        super();
        this.results = results;
    }
    /**
     * @returns {{count: number}}
     */
    data(){
        return this.results;
    }
}

class MemoryDataSourceDocumentRef extends IBackendDataSourceDocumentRef{
    /**
     * 
     * @param {string} id 
     * @param {Object.<string, any>} collection 
     * @param {MemoryDataSourceCollectionRef} parent 
     */
    constructor(id, collection, parent) {
        super(parent);
        this.id = id;
        this.collection = collection
    }

    /**
     * @override
     */
    async _get() {
        return new MemoryDataSourceDocumentSnapshot(this.collection[this.id], this);
    }

    /**
     * @override
     * @param {Object} object 
     */
    async _set(object) {
        this.collection[this.id] = utility.deepCopy(object);
    }

    /**
     * @override
     * @param {Object} object 
     */
    async _update(object) {
        for(const field in object) {
            const dottedFields = field.split('.');

            let leafObject = this.collection[this.id];
            for(let i=0; i < dottedFields.length - 1; i++) {
                leafObject = leafObject[dottedFields[i]];
            }

            const targetAttribute = dottedFields[dottedFields.length - 1];

            if(object[field] && object[field].hasOwnProperty('fieldType')) {
                if(object[field].fieldType == FieldValue.ArrayType) {
                    switch(object[field].arrayOp) {
                        case FieldValue.UnionOp: {
                            const array1 = leafObject[targetAttribute];
                            const stringArray1 = flattenObjectArray(array1);
                            const array2 = object[field].arrayElements;
                            array2.forEach(x => {
                                if (!stringArray1.includes(JSON.stringify(x))) {
                                    array1.push(x);
                                }
                            });
                            break;
                        }
                        case FieldValue.RemoveOp: {
                            const array1 = leafObject[targetAttribute];
                            const array2 = flattenObjectArray(object[field].arrayElements);
                            leafObject[targetAttribute] = array1.filter(x => !array2.includes(JSON.stringify(x)));
                            break;
                        }
                    }
                }
            }
            else {
                leafObject[dottedFields[dottedFields.length - 1]] = object[field];
            }
        }
    }

    /**
     * @override
     */
    async delete() {
        delete this.collection[this.id];    
    }
}

class MemoryDataSourceDocumentSnapshot extends IBackendDataSourceDocumentSnapshot{
    /**
     * 
     * @param {Object} document 
     * @param {MemoryDataSourceDocumentRef} ref 
     */
    constructor(document, ref) {
        super(ref, document);
    }
}

/**
 * In-memory implementation of a query.
 * @extends IBackendDataSourceQuery
 */
class MemoryDataSourceQuery extends IBackendDataSourceQuery {
    /**
     * @param {string} field
     * @param {string} opStr
     * @param {any} value
     * @param {Object.<string, any>} collection
     * @param {MemoryDataSourceCollectionRef} parent 
     */
    constructor(field, opStr, value, collection, parent) {
        super(parent);
        this.field = field;
        this.opStr = opStr;
        this.value = value;
        this.collection = collection;
    }

    /**
     * Executes the query and returns a snapshot.
     * @returns {Promise<MemoryDataSourceQuerySnapShot>}
     */
    async get() {
        const queryResults = [];

        for(const document in this.collection) {
            switch(this.opStr) {
                case '==':
                    if(this.collection[document][this.field] == this.value){
                        queryResults.push(await new MemoryDataSourceDocumentRef(document, this.collection,
                            /**@type {MemoryDataSourceCollectionRef}*/(this.parent)
                        )._get());
                    }
                    break;
            }
        }
        return new MemoryDataSourceQuerySnapShot(queryResults);
    }

    count() {
        return new MemoryDataSourceAggregateQuery(/**@type {MemoryDataSourceCollectionRef}*/(this.parent));
    }
}

/**
 * Query snapshot for memory data source.
 * @extends IBackendDataSourceQuerySnapShot
 */
class MemoryDataSourceQuerySnapShot extends IBackendDataSourceQuerySnapShot{
    /**
     * @param {MemoryDataSourceDocumentSnapshot[]} queryResults
     */
    constructor(queryResults) {
        super();
        this.docs = queryResults;
        this.empty = queryResults.length == 0;
    }

    /**
     * Iterates over each document in the snapshot.
     * @param {(element: MemoryDataSourceDocumentSnapshot) => void} callback
     */
    forEach(callback) {
        this.docs.forEach(element => {
            callback(element);
        });
    }
}

/**
 * Transaction for memory data source.
 * @extends IBackendDataSourceTransaction
 */
class MemoryDataSourceTransaction extends IBackendDataSourceTransaction {
    /**
     * Gets a document or query snapshot.
     * @param {MemoryDataSourceDocumentRef|MemoryDataSourceQuery} refOrQuery
     * @returns {Promise<any>}
     * @override
     */
    async _get(refOrQuery) {
        if (refOrQuery instanceof MemoryDataSourceDocumentRef) {
            return await refOrQuery._get();
        }
        return await refOrQuery.get();
    }

    /**
     * Creates a document.
     * @param {MemoryDataSourceDocumentRef} documentRef
     * @param {Object} data
     * @returns {this}
     * @override
     */
    _create(documentRef, data) {
        documentRef._set(data);
        return this;
    }

    /**
     * Sets a document.
     * @param {MemoryDataSourceDocumentRef} documentRef
     * @param {Object} data
     * @returns {this}
     * @override
     */
    _set(documentRef, data) {
        documentRef._set(data);
        return this;
    }

    /**
     * Updates a document.
     * @param {MemoryDataSourceDocumentRef} documentRef
     * @param {Object} updateObject
     * @returns {this}
     * @override
     */
    _update(documentRef, updateObject) {
        documentRef._update(updateObject);
        return this;
    }
}

module.exports = MemoryBackedDataSource;