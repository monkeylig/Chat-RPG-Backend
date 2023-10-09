const { v4: uuidv4 } = require('uuid');

const utility = {
    genId() {
        return uuidv4();
    },
    deepCopy(object) {
        return JSON.parse(JSON.stringify(object));
    }
}

module.exports = utility;