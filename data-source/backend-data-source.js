
class IBackendDataSource {

    initializeDataSource(options) {
        console.log("backend initializeDataSource()");
    }

    getStartingAvatars() {
        console.log("backend getStartingAvatars()");
    }

    addAccount(account) {
        console.log("backend addAccount()");
    }
}

module.exports = IBackendDataSource;