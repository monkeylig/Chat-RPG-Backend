const https = require('https');
const utility = require('./utility');

const Endpoint = '/get_starting_avatars';

async function test_get_starting_avatars() {
    await utility.backendCall(Endpoint, 'GET').then(data => {
        const responce = JSON.parse(data);
        if(Array.isArray(responce)) {
            utility.pass(Endpoint);
        }
        else {
            utility.fail(Endpoint);
        }
    }).catch(error => {
        utility.fail(Endpoint);
        console.error(error);
    });
}

module.exports = test_get_starting_avatars;