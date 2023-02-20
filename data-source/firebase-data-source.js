const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const BDS = require("./backend-data-source")

class FirebaseDataSource extends BDS.IBackendDataSource {

    constructor() {
        super();
    }

    async initializeDataSource() {
        initializeApp({ projectId: "demo-test" });
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
        return new FirebaseDataSourceDocumentSnapshot(doc);
    }

    async set(object) {
        await this.docRef.set(object);
    }

    async update(object) {
        const updateObj = object;

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

        await this.docRef.update(updateObj);
    }
}

class FirebaseDataSourceDocumentSnapshot {
    constructor(snapshot) {
        this.snapshot = snapshot;
        this.exists = snapshot.exists;
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
            return await this.transaction.get(refOrQuery.query);
        }
        else if(refOrQuery.hasOwnProperty('docRef')) {
            return await this.transaction.get(refOrQuery.docRef);
        }
    }

    create(documentRef, data) {
        this.transaction.create(documentRef.docRef, data);
    }
}


module.exports = FirebaseDataSource;