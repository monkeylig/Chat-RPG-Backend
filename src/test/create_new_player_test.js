const https = require('https');
const utility = require('./utility');

const Endpoint = '/create_new_player';

async function test_create_new_player() {
    const body = {
        name: 'avenger',
        avatar: 'goat.png',
        playerId: utility.genId()
    };

    const url = Endpoint + '?platform=' + 'twitch';
    await utility.backendCall(url, 'PUT', body).then(data => {
        const responce = JSON.parse(data);
        
        if(responce.hasOwnProperty('playerId') && typeof responce.playerId =='string' ) {
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
    await utility.backendCall(url, 'PUT', body).then(data => {
        utility.fail(secondTest);
    })
    .catch(error => {
        if(error.serverError) {
                const responce = JSON.parse(error.data);
                if(responce.errorCode == 2) {
                    utility.pass(secondTest);
                }
                else {
                    utility.fail(secondTest);        
                }
        } else {
            utility.fail(secondTest);
        }
    });
}

module.exports = test_create_new_player;