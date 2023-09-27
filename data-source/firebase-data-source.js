const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const BDS = require("./backend-data-source")

class FirebaseDataSource extends BDS.IBackendDataSource {

    constructor() {
        super();
    }

    async initializeDataSource() {
        if(process.env.NODE_ENV === 'production') {
            initializeApp({ credential: applicationDefault() });
        }
        else {
            initializeApp({ projectId: "demo-test" });
        }
    }

    collection(name) {
        let col = getFirestore().collection(name);
        return new FirebaseDataSourceCollectionRef(col);
    }

    async runTransaction(transactionFunction) {
        return await getFirestore().runTransaction(async (t) => {
            return await transactionFunction(new FirebaseDataSourceTransaction(t));
        });
    }
}

class FirebaseDataSourceCollectionRef {

    constructor(collectionRef) {
        this.collectionRef = collectionRef;
    }

    async add(object) {
        let docRef = await this.collectionRef.add(object)
        return new FirebaseDataSourceDocumentRef(docRef);
    }

    doc(path) {
        if(path) {
            return new FirebaseDataSourceDocumentRef(this.collectionRef.doc(path));
        }
        return new FirebaseDataSourceDocumentRef(this.collectionRef.doc());
    }

    where(field, opStr, value) {
        return new FirebaseDataSourceQuery(this.collectionRef.where(field, opStr, value));
    }
}

class FirebaseDataSourceDocumentRef {
    constructor(docRef) {
        this.docRef = docRef;
        this.id = docRef.id;
    }

    async get() {
        let doc = await this.docRef.get();
        return new FirebaseDataSourceDocumentSnapshot(doc, this);
    }

    async set(object) {
        await this.docRef.set(object);
    }

    async update(object) {

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

    create(documentRef, data) {
        this.transaction.create(documentRef.docRef, data);
        return this;
    }

    set(documentRef, data) {
        this.transaction.set(documentRef.docRef, data);
        return this;
    }

    update(documentRef, updateObject) {
        this.transaction.update(documentRef.docRef, FirebaseDataSourceDocumentRef.convertUpdateObject(updateObject));
        return this;
    }
}


module.exports = FirebaseDataSource;