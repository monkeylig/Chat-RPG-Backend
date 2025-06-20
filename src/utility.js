const { v4: uuid4 } = require('uuid');
const jwt = require('jsonwebtoken');

/**
 * Generates a uuid
 * @returns {string} The new uuid
 */
function genId() {
    return uuid4();
}

function deepCopy(object) {
    return JSON.parse(JSON.stringify(object));
}

/**
 * 
 * @param {string} token 
 * @param {string} secret 
 * @returns {jwt.JwtPayload | string}
 */
function verifyJWT(token, secret) {
    return jwt.verify(token, Buffer.from(secret, 'base64'));
}

/**
 * @module utility
 */
module.exports = {
    genId,
    deepCopy,
    verifyJWT
};