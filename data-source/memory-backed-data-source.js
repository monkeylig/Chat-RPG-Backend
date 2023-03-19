const {IBackendDataSource, FieldValue} = require("./backend-data-source")

const utility = require("../utility");

/**
 * Data Source structure
 * {
 *  starting_avatars: ['avatar-filename'(string), 'avatar-filename'(string), 'avatar-filename'(string)]
 * }
 */

class MemoryBackedDataSource extends IBackendDataSource {
    dataSource;

    constructor() {
        super();
        this.dataSource = {};
    }

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

    collection(name) {
        return new MemoryDataSourceCollectionRef(this.dataSource, name);
    }

    async runTransaction(transactionFunction) {
        return await transactionFunction(new MemoryDataSourceTransaction());
    }

    //#region gen 2
    async addDocumentToCollection(document, collection) {
        this.verifyCollection(collection);

        document._id = utility.genId();
        this.dataSource[collection].push(document);

        return document;
    }

    async getCollection(collection) {
        this.verifyCollection(collection);

        return this.dataSource[collection];
    }

    async findDocumentInCollection(value, macher, collection) {
        this.verifyCollection(collection);

        const collectionObj = this.dataSource[collection];
        for(let i = 0; i < collectionObj.length; i++) {
            if(collectionObj[i][macher] === value) {
                return collectionObj[i];
            }
        }
        return {};
    }

    async updateDocumentInCollection(filter, updateDoc, collection) {
        this.verifyCollection(collection);

        const collectionObj = this.dataSource[collection];
        const targetDocuments = this.filterCollectionArray(filter, collectionObj);

        for(const target of targetDocuments) {
            this.applyUpdateDoc(updateDoc, target);
        }
    }

    verifyCollection(collection) {
        if(!this.dataSource.hasOwnProperty(collection)) {
            this.dataSource[collection] = [];
        }
    }
    //#endregion
    //#region Legacy Interface
    async getStartingAvatars() {
        const avatars = this.dataSource["starting_avatars"];
        if (avatars.length == 0)
        {
            return {};
        }
        return avatars;
    }

    async addAccount(obj) {
        this.dataSource["accounts"].push(obj);
    }
    //#endregion
}

class MemoryDataSourceCollectionRef {

    constructor(dataSource, collectionName) {
        this.dataSource = dataSource;
        this.collectionName = collectionName;
    }
    async add(object) {
        this.verifyCollection();

        const id = utility.genId();
        this.dataSource[this.collectionName][id] = object;
        return new MemoryDataSourceDocumentRef(id, this.dataSource[this.collectionName]);
    }

    doc(path) {
        this.verifyCollection();

        if(!path) {
            const id = utility.genId();
            return new MemoryDataSourceDocumentRef(id, this.dataSource[this.collectionName]);
        }

        return new MemoryDataSourceDocumentRef(path, this.dataSource[this.collectionName]);
    }

    where(field, opStr, value) {
        if(!this.collectionExists()) {
            return new MemoryDataSourceQuery(field, opStr, value, {});
        }

        return new MemoryDataSourceQuery(field, opStr, value, this.dataSource[this.collectionName]);
    }

    createDocument(object, id) {
        const newObject = Object.assign({}, object);
        if(id) {
            newObject._id = id;    
        }
        else {
            newObject._id = utility.genId();
        }
        return newObject;
    }

    
    verifyCollection() {
        if(!this.collectionExists()) {
            this.dataSource[this.collectionName] = {};
        }
    }

    collectionExists() {
        return this.dataSource.hasOwnProperty(this.collectionName);
    }
}

class MemoryDataSourceDocumentRef {
    id;

    constructor(id, collection) {

        this.id = id;
        this.collection = collection
    }

    async get() {
        return new MemoryDataSourceDocumentSnapshot(this.collection[this.id], this);
    }

    async set(object) {
        this.collection[this.id] = Object.assign({}, object);
    }

    async update(object) {
        for(const field in object) {
            const dottedFields = field.split('.');

            let leafObject = this.collection[this.id];
            for(let i=0; i < dottedFields.length - 1; i++) {
                leafObject = leafObject[dottedFields[i]];
            }

            const targetAttribute = dottedFields[dottedFields.length - 1];

            if(object[field].hasOwnProperty('fieldType')) {
                if(object[field].fieldType == FieldValue.Arraytype) {
                    const array1 = leafObject[targetAttribute];
                    const array2 = object[field].arrayElements;
                    switch(object[field].arrayOp) {
                        case FieldValue.UnionOp:
                            leafObject[targetAttribute] = array1.concat(array2);
                            break;
                        case FieldValue.RemoveOp:
                            leafObject[targetAttribute] = array1.filter(x => !array2.includes(x));
                            break;
                    }
                }
            }
            else {
                leafObject[dottedFields[dottedFields.length - 1]] = object[field];
            }
        }
    }
}

class MemoryDataSourceDocumentSnapshot {
    constructor(document, ref) {
        this.document = document;
        this.ref = ref;

        if(document) {
            this.exists = true;
        } else {
            this.exists = false;
        }
    }

    data() {
        if (this.exists) {
            return Object.assign({}, this.document);
        }

        return;
    }
}

class MemoryDataSourceQuery {
    constructor(field, opStr, value, collection) {
        this.field = field;
        this.opStr = opStr;
        this.value = value;
        this.collection = collection;
    }

    async get() {
        const queryResults = [];

        for(const document in this.collection) {
            switch(this.opStr) {
                case '==':
                    if(this.collection[document][this.field] == this.value){
                        queryResults.push(await new MemoryDataSourceDocumentRef(document, this.collection).get());
                    }
                    break;
            }
        }
        return new MemoryDataSourceQuerySnapShot(queryResults);
    }
}

class MemoryDataSourceQuerySnapShot {
    empty;

    constructor(queryResults) {
        this.docs = queryResults;
        this.empty = queryResults.length == 0;
    }

    forEach(callback) {
        this.docs.forEach(element => {
            callback(element);
        });
    }
}

class MemoryDataSourceTransaction {
    async get(refOrQuery) {
        return await refOrQuery.get();
    }
    create(documentRef, data) {
        documentRef.set(data);
    }
}

module.exports = MemoryBackedDataSource;