/**
 * @import {Firestore, DocumentData, DocumentReference, CollectionReference,
 * WhereFilterOp, WithFieldValue,
 AggregateQuerySnapshot} from 'firebase-admin/firestore'
 */

const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const BDS = require("./backend-data-source");

/**
 * 
 * @param {string} prop 
 * @param {Object} object 
 */
function processObjectProp(prop, object) {
    if (object[prop] === BDS.FieldValue.Timestamp) {
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

class FirebaseDataSource extends BDS.IBackendDataSource {
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

    async initializeDataSource() {
        this.initializeFirestore();
    }

    collection(name) {
        if (!this.#db) {
            this.initializeFirestore();
        }
        let col = getFirestore().collection(name);
        return new FirebaseDataSourceCollectionRef(col);
    }

    async runTransaction(transactionFunction) {
        if (!this.#db) {
            return;
        }
        return await getFirestore().runTransaction(async (t) => {
            return await transactionFunction(new FirebaseDataSourceTransaction(t));
        });
    }
}

/**
 * @extends {BDS.IBackendDataSourceCollectionRef}
 */
class FirebaseDataSourceCollectionRef {
    /**
     * 
     * @param {CollectionReference<DocumentData, DocumentData>} collectionRef 
     */
    constructor(collectionRef) {
        this.collectionRef = collectionRef;
    }

    /**
     * 
     * @param {Object} object 
     * @returns {Promise<FirebaseDataSourceDocumentRef>}
     */
    async add(object) {
        processObjectWrite(object);
        let docRef = await this.collectionRef.add(object)
        return new FirebaseDataSourceDocumentRef(docRef);
    }

    doc(path) {
        if(path) {
            return new FirebaseDataSourceDocumentRef(this.collectionRef.doc(path));
        }
        return new FirebaseDataSourceDocumentRef(this.collectionRef.doc());
    }

    /**
     * 
     * @param {string} field 
     * @param {WhereFilterOp} opStr 
     * @param {any} value 
     * @returns {FirebaseDataSourceQuery}
     */
    where(field, opStr, value) {
        return new FirebaseDataSourceQuery(this.collectionRef.where(field, opStr, value));
    }

    count() {
        return new FirebaseDataSourceAggregateQuery(this.collectionRef.count());
    }
}

class FirebaseDataSourceAggregateQuery extends BDS.IBackendDataSourceAggregateQuery {
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

class FirebaseDataSourceAggregateQuerySnapShot extends  BDS.IBackendDataSourceAggregateQuerySnapShot{
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

class FirebaseDataSourceDocumentRef {
    /**
     * 
     * @param {DocumentReference<DocumentData, DocumentData>} docRef 
     */
    constructor(docRef) {
        this.docRef = docRef;
        this.id = docRef.id;
    }

    async get() {
        let doc = await this.docRef.get();
        return new FirebaseDataSourceDocumentSnapshot(doc, this);
    }

    /**
     * 
     * @param {WithFieldValue<DocumentData>} object 
     * @returns {Promise}
     */
    async set(object) {
        processObjectWrite(object);
        await this.docRef.set(object);
    }

    /**
     * 
     * @param {Object} object 
     */
    async update(object) {
        processObjectWrite(object);
        await this.docRef.update(FirebaseDataSourceDocumentRef.convertUpdateObject(object));
    }

    async delete() {
        this.docRef.delete();
    }

    static convertUpdateObject(updateObject) {
        const updateObj = updateObject;

        for(const prop in updateObj) {
            if(typeof updateObj[prop] == 'object' && updateObj[prop].hasOwnProperty('fieldType')) {
                if(updateObj[prop].fieldType == BDS.FieldValue.Arraytype) {
                    switch(updateObj[prop].arrayOp) {
                        case BDS.FieldValue.UnionOp:
                            updateObj[prop] = FieldValue.arrayUnion(...updateObj[prop].arrayElements);
                            break;
                        case BDS.FieldValue.RemoveOp:
                            updateObj[prop] = FieldValue.arrayRemove(...updateObj[prop].arrayElements);
                            break;
                    }
                }
            }
        }
        return updateObj;
    }
}

class FirebaseDataSourceDocumentSnapshot {
    constructor(snapshot, ref) {
        this.snapshot = snapshot;
        this.exists = snapshot.exists;
        this.ref = ref;
    }
    data() {
        return this.snapshot.data();
    }
}

class FirebaseDataSourceQuery {
    constructor(query) {
        this.query = query;
    }

    async get() {
        return new FirebaseDataSourceQuerySnapShot(await this.query.get());
    }
}

class FirebaseDataSourceQuerySnapShot {

    constructor(snapshot) {
        this.snapshot = snapshot;
        this.empty = snapshot.empty;
        this.docs = snapshot.docs;
    }

    forEach(callback) {
        this.snapshot.forEach(documentSnapshot => {
            callback(new FirebaseDataSourceDocumentSnapshot(documentSnapshot));
        })
    }
}

class FirebaseDataSourceTransaction {

    constructor(transaction) {
        this.transaction = transaction;
    }

    async get(refOrQuery) {
        if(refOrQuery.hasOwnProperty('query')) {
            const snapShot = await this.transaction.get(refOrQuery.query);
            return new FirebaseDataSourceQuerySnapShot(snapShot);
        }
        else if(refOrQuery.hasOwnProperty('docRef')) {
            const snapShot = await this.transaction.get(refOrQuery.docRef);
            return new FirebaseDataSourceDocumentSnapshot(snapShot, new FirebaseDataSourceDocumentRef(snapShot.ref));
        }
    }

    /**
     * 
     * @param {FirebaseDataSourceDocumentRef} documentRef 
     * @param {Object} data 
     * @returns 
     */
    create(documentRef, data) {
        processObjectWrite(data);
        this.transaction.create(documentRef.docRef, data);
        return this;
    }

    /**
     * 
     * @param {FirebaseDataSourceDocumentRef} documentRef 
     * @param {Object} data 
     * @returns {FirebaseDataSourceTransaction}
     */
    set(documentRef, data) {
        processObjectWrite(data)
        this.transaction.set(documentRef.docRef, data);
        return this;
    }

    /**
     * 
     * @param {FirebaseDataSourceDocumentRef} documentRef 
     * @param {Object} updateObject 
     * @returns {FirebaseDataSourceTransaction}
     */
    update(documentRef, updateObject) {
        processObjectWrite(updateObject);
        this.transaction.update(documentRef.docRef, FirebaseDataSourceDocumentRef.convertUpdateObject(updateObject));
        return this;
    }
}


module.exports = FirebaseDataSource;