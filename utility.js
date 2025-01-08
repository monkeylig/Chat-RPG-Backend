const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const utility = {
    /**
     * Generates a uuid
     * @returns {string} The new uuid
     */
    genId() {
        return uuidv4();
    },
    deepCopy(object) {
        return JSON.parse(JSON.stringify(object));
    },
    /**
     * 
     * @param {string} token 
     * @param {string} secret 
     * @returns 
     */
    verifyJWT(token, secret) {
        return jwt.verify(token, Buffer.from(secret, 'base64'));
    }
}

/**
 * @module utility
 */
module.exports = utility;