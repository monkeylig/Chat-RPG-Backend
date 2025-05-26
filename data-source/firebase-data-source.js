/**
 * @import {Firestore, DocumentData, DocumentReference, CollectionReference,
 * WhereFilterOp, WithFieldValue, AggregateQuerySnapshot} from 'firebase-admin/firestore'
 * @import {BackendDatabaseProcessorManager, TransactionFunction} from './backend-data-source'
 */

const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const {IBackendDataSource, IBackendDataSourceCollectionRef, IBackendDataSourceAggregateQuery, IBackendDataSourceAggregateQuerySnapShot,
    IBackendDataSourceDocumentRef, FieldValue: BDSFieldValue,
    IBackendDataSourceDocumentSnapshot,
    IBackendDataSourceQuery,
    IBackendDataSourceQuerySnapShot,
    IBackendDataSourceTransaction,
    Timestamp: BDSTimestamp} = require("./backend-data-source");

/**
 * 
 * @param {string} prop 
 * @param {Object} object 
 */
function processObjectProp(prop, object) {
    if (object[prop] === BDSFieldValue.Timestamp) {
        object[prop] = FieldValue.serverTimestamp();
    }
}

/**
 * 
 * @param {Object} object 
 */
function processObjectWrite(object) {
    for(const prop in object) {
        processObjectProp(prop, object);
    }
}

class FirebaseDataSource extends IBackendDataSource {
    /**@type {Firestore|undefined} */
    #db;
    constructor() {
        super();
    }

    initializeFirestore() {
        if(process.env.NODE_ENV === 'production') {
            initializeApp({ credential: applicationDefault() });
        }
        else {
            initializeApp({ projectId: "demo-test" });
        }

        this.#db = getFirestore();
        this.#db.settings({
            ignoreUndefinedProperties: true
        });
    }

    /**
     * @override
     */
    async initializeDataSource() {
        this.initializeFirestore();
    }

    /**
     * @override
     * @param {string} name 
     * @returns {FirebaseDataSourceCollectionRef}
     */
    collection(name) {
        if (!this.#db) {
            this.initializeFirestore();
        }
        let col = getFirestore().collection(name);
        return new FirebaseDataSourceCollectionRef(col, name, this.processorManager);
    }

    /**
     * 
     * @param {TransactionFunction} transactionFunction 
     * @returns {Promise<any>}
     * @override
     */
    async runTransaction(transactionFunction) {
        if (!this.#db) {
            return;
        }
        return await getFirestore().runTransaction(async (t) => {
            return await transactionFunction(new FirebaseDataSourceTransaction(t, this.processorManager));
        });
    }

    /**
     * 
     * @param {number} [value] 
     * @returns {any}
     * @override
     */
    timestamp(value) {
        if (value) {
            return Timestamp.fromMillis(value);
        }
        return Timestamp.now(); // Return current time if no value is provided
    }
}

class FirebaseDataSourceCollectionRef extends IBackendDataSourceCollectionRef {
    /**
     * 
     * @param {CollectionReference<DocumentData, DocumentData>} collectionRef 
     * @param {string} name 
     * @param {BackendDatabaseProcessorManager} processorManager 
     */
    constructor(collectionRef, name, processorManager) {
        super(name, processorManager);
        /**@type {CollectionReference<DocumentData, DocumentData>} */
        this.collectionRef = collectionRef;
    }

    /**
     * 
     * @param {Object} object 
     * @returns {Promise<FirebaseDataSourceDocumentRef>}
     * @override
     */
    async _add(object) {
        processObjectWrite(object);
        let docRef = await this.collectionRef.add(object)
        return new FirebaseDataSourceDocumentRef(docRef, this);
    }

    /**
     * 
     * @param {string} [path] 
     * @returns {FirebaseDataSourceDocumentRef}
     * @override
     */
    doc(path) {
        if(path) {
            return new FirebaseDataSourceDocumentRef(this.collectionRef.doc(path), this);
        }
        return new FirebaseDataSourceDocumentRef(this.collectionRef.doc(), this);
    }

    /**
     * 
     * @param {string} field 
     * @param {WhereFilterOp} opStr 
     * @param {any} value 
     * @returns {FirebaseDataSourceQuery}
     * @override
     */
    where(field, opStr, value) {
        return new FirebaseDataSourceQuery(this.collectionRef.where(field, opStr, value), this);
    }

    /**
     * 
     * @returns {FirebaseDataSourceAggregateQuery}
     * @override
     */
    count() {
        return new FirebaseDataSourceAggregateQuery(this.collectionRef.count());
    }
}

class FirebaseDataSourceAggregateQuery extends IBackendDataSourceAggregateQuery {
    /**
     * @typedef {FirebaseFirestore.AggregateQuery<{count: FirebaseFirestore.AggregateField<number>;}, DocumentData, DocumentData>} AgQuery
     * 
     * @param {} agQuery 
     */
    constructor (agQuery) {
        super();
        /**@type {AgQuery} */
        this.query = agQuery;
    }
    /**
     * 
     * @returns {Promise<FirebaseDataSourceAggregateQuerySnapShot>}
     */
    async get() {
        return new FirebaseDataSourceAggregateQuerySnapShot(await this.query.get());
    }
}

class FirebaseDataSourceAggregateQuerySnapShot extends IBackendDataSourceAggregateQuerySnapShot{
    /**
     * @typedef {AggregateQuerySnapshot<{count: FirebaseFirestore.AggregateField<number>;}, DocumentData, DocumentData>} AgQuerySnapshot
     * 
     * @param {AgQuerySnapshot} agQuery 
     */
    constructor (agQuery) {
        super();
        /**@type {AgQuerySnapshot} */
        this.query = agQuery;
    }
    /**
     * @returns {{count: number}}
     */
    data(){
        return {count: this.query.data().count};
    }
}

class FirebaseDataSourceDocumentRef extends IBackendDataSourceDocumentRef{
    /**
     * 
     * @param {DocumentReference<DocumentData, DocumentData>} docRef 
     * @param {FirebaseDataSourceCollectionRef} parent 
     */
    constructor(docRef, parent) {
        super(parent);
        /**@type {DocumentReference<DocumentData, DocumentData>} */
        this.docRef = docRef;
        this.id = docRef.id;
    }

    /**
     * 
     * @returns {Promise<FirebaseDataSourceDocumentSnapshot>}
     * @override
     */
    async _get() {
        let doc = await this.docRef.get();
        return new FirebaseDataSourceDocumentSnapshot(doc, this);
    }

    /**
     * 
     * @param {WithFieldValue<DocumentData>} object 
     * @returns {Promise}
     * @override
     */
    async _set(object) {
        processObjectWrite(object);
        await this.docRef.set(object);
    }

    /**
     * 
     * @param {Object} object \
     * @overrides
     */
    async _update(object) {
        processObjectWrite(object);
        await this.docRef.update(FirebaseDataSourceDocumentRef.convertUpdateObject(object));
    }

    /**
     * @override
     */
    async delete() {
        this.docRef.delete();
    }

    static convertUpdateObject(updateObject) {
        const updateObj = updateObject;

        for(const prop in updateObj) {
            if(typeof updateObj[prop] == 'object' && updateObj[prop].hasOwnProperty('fieldType')) {
                if(updateObj[prop].fieldType == BDSFieldValue.ArrayType) {
                    switch(updateObj[prop].arrayOp) {
                        case BDSFieldValue.UnionOp:
                            updateObj[prop] = FieldValue.arrayUnion(...updateObj[prop].arrayElements);
                            break;
                        case BDSFieldValue.RemoveOp:
                            updateObj[prop] = FieldValue.arrayRemove(...updateObj[prop].arrayElements);
                            break;
                    }
                }
            }
        }
        return updateObj;
    }
}

class FirebaseDataSourceDocumentSnapshot extends IBackendDataSourceDocumentSnapshot{
    /**
     * 
     * @param {FirebaseFirestore.DocumentSnapshot<DocumentData, DocumentData>} snapshot 
     * @param {FirebaseDataSourceDocumentRef} ref 
     */
    constructor(snapshot, ref) {
        super(ref);
        /**@type {FirebaseFirestore.DocumentSnapshot<DocumentData, DocumentData>} */
        this.snapshot = snapshot;
        /**@type {boolean} */
        this.exists = snapshot.exists;
        this._data = snapshot.data();
    }
}

class FirebaseDataSourceQuery extends IBackendDataSourceQuery {
    /**
     * 
     * @param {FirebaseFirestore.Query<DocumentData, DocumentData>} query 
     * @param {FirebaseDataSourceCollectionRef} parent
     */
    constructor(query, parent) {
        super(parent);
        /**@type {FirebaseFirestore.Query<DocumentData, DocumentData>} */
        this.query = query;
        /**@type {FirebaseDataSourceCollectionRef} */
        this.parent = parent;
    }

    async get() {
        return new FirebaseDataSourceQuerySnapShot(await this.query.get(), /**@type {FirebaseDataSourceCollectionRef}*/(this.parent));
    }

    count() {
        return new FirebaseDataSourceAggregateQuery(this.query.count());
    }
}

class FirebaseDataSourceQuerySnapShot extends IBackendDataSourceQuerySnapShot {
    /**
     * 
     * @param {FirebaseFirestore.QuerySnapshot<DocumentData, DocumentData>} snapshot 
     * @param {FirebaseDataSourceCollectionRef} parent
     */
    constructor(snapshot, parent) {
        super();
        /**@type {FirebaseFirestore.QuerySnapshot<DocumentData, DocumentData>} */
        this.snapshot = snapshot;
        /**@type {boolean} */
        this.empty = snapshot.empty;

        this.snapshot.forEach(documentSnapshot => {
            this.docs.push(new FirebaseDataSourceDocumentSnapshot(documentSnapshot, new FirebaseDataSourceDocumentRef(documentSnapshot.ref, parent)));
        });
    }

    /**
     * 
     * @param {(element: FirebaseDataSourceDocumentSnapshot) => void} callback 
     */
    forEach(callback) {
        this.docs.forEach(element => {
            callback(/**@type {FirebaseDataSourceDocumentSnapshot}*/(element));
        });
    }
}

class FirebaseDataSourceTransaction extends IBackendDataSourceTransaction {
    /**
     * 
     * @param {FirebaseFirestore.Transaction} transaction 
     * @param {BackendDatabaseProcessorManager} processorManager 
     */
    constructor(transaction, processorManager) {
        super(processorManager);
        /**@type {FirebaseFirestore.Transaction} */
        this.transaction = transaction;
    }

    /**
     * 
     * @param {FirebaseDataSourceDocumentRef | FirebaseDataSourceQuery} refOrQuery 
     * @returns {Promise<FirebaseDataSourceDocumentSnapshot | FirebaseDataSourceQuerySnapShot>}
     * @override
     */
    async _get(refOrQuery) {
        if (refOrQuery instanceof FirebaseDataSourceDocumentRef) {
            const snapShot = await this.transaction.get(refOrQuery.docRef);
            return new FirebaseDataSourceDocumentSnapshot(snapShot, new FirebaseDataSourceDocumentRef(snapShot.ref, /**@type {FirebaseDataSourceCollectionRef}*/(refOrQuery.parent)));
        }

        const snapShot = await this.transaction.get(refOrQuery.query);
        return new FirebaseDataSourceQuerySnapShot(snapShot, /**@type {FirebaseDataSourceCollectionRef}*/(refOrQuery.parent));
    }

    /**
     * 
     * @param {FirebaseDataSourceDocumentRef} documentRef 
     * @param {Object} data 
     * @returns 
     * @override
     */
    _create(documentRef, data) {
        processObjectWrite(data);
        this.transaction.create(documentRef.docRef, data);
        return this;
    }

    /**
     * 
     * @param {FirebaseDataSourceDocumentRef} documentRef 
     * @param {Object} data 
     * @returns {FirebaseDataSourceTransaction}
     * @override
     */
    _set(documentRef, data) {
        processObjectWrite(data)
        this.transaction.set(documentRef.docRef, data);
        return this;
    }

    /**
     * 
     * @param {FirebaseDataSourceDocumentRef} documentRef 
     * @param {Object} updateObject 
     * @returns {FirebaseDataSourceTransaction}
     * @override
     */
    _update(documentRef, updateObject) {
        processObjectWrite(updateObject);
        this.transaction.update(documentRef.docRef, FirebaseDataSourceDocumentRef.convertUpdateObject(updateObject));
        return this;
    }
}

class FirebaseTimestamp extends BDSTimestamp {
    /**
     * 
     * @param {number} value
     * 
     */
    fromMilliseconds(value) {
        return Timestamp.fromMillis(value);
    }
}


module.exports = FirebaseDataSource;