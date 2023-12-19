const { v4: uuidv4 } = require('uuid');
const Buffer = require('buffer/').Buffer
const jwt = require('jsonwebtoken');

const utility = {
    genId() {
        return uuidv4();
    },
    deepCopy(object) {
        return JSON.parse(JSON.stringify(object));
    },
    verifyJWT(token, secret) {
        return jwt.verify(token, Buffer.from(secret, 'base64'));
    }
}

module.exports = utility;