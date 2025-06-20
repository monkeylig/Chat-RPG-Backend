const { BackendDatabaseProcessor, IBackendDataSourceCollectionRef, IBackendDataSourceDocumentRef, FieldValue } = require("../data-source/backend-data-source");
const {Schema} = require("./datasource-schema");

class RPGDatabaseProcessor extends BackendDatabaseProcessor {
    /**
     * An event that is called when a document is written to the database. This is called before the data is written to the document.
     * @param {IBackendDataSourceCollectionRef} collectionRef 
     * @param {IBackendDataSourceDocumentRef | undefined} documentRef 
     * @param {Object} data 
     * @param {string} method 
     */
    onWrite(collectionRef, documentRef, data, method) {
        if(!data) {
            return;
        }
        
        if(data.created && data.created != FieldValue.Timestamp) {
            delete data.created;
        }

        if(collectionRef.name === Schema.Collections.Accounts) {
            data.lastAction = FieldValue.Timestamp;
        }
    }
};

module.exports = {RPGDatabaseProcessor};
