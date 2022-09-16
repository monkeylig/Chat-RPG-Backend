
class IBackendDataSource {

    initializeDataSource(options) {
        console.log("backend initializeDataSource()");
    }

    addAccount(account) {
        console.log("backend addAccount()");
    }
}

module.exports = IBackendDataSource;