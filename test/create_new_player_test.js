const https = require('https');
const utility = require('./utility');

const Endpoint = '/create_new_player';

async function test_create_new_player() {
    const body = {
        name: 'avenger',
        avatar: 'goat.png',
        twitchId: Math.floor(Math.random() * 10000).toString()
    };

    await utility.backendCall(Endpoint, 'PUT', body).then(data => {
        const responce = JSON.parse(data);
        
        if(responce.message == 'OK') {
            utility.pass(Endpoint);
        }
        else {
            utility.fail(Endpoint);  
        }
    })
    .catch(error => {
        utility.fail(Endpoint);
    });

    const secondTest = Endpoint + " duplicate";
    // Testing if the service will reject a player that already exists
    await utility.backendCall(Endpoint, 'PUT', body).then(data => {
        utility.fail(secondTest);
    })
    .catch(error => {
        if(error.serverError) {
                const responce = JSON.parse(error.data);
                if(responce.errorCode == 2) {
                    utility.pass(secondTest);
                }
        } else {
            utility.fail(secondTest);
        }
    });
}

module.exports = test_create_new_player;