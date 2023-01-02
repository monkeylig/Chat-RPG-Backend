const https = require('https');
const utility = require('./utility');

const Endpoint = '/get_player';

async function test_get_player() {
    const twichId = Math.floor(Math.random() * 10000).toString();
    const body = {
        name: 'test player',
        avatar: 'pig.png',
        twitchId: twichId
    };
    data = await utility.backendCall('/create_new_player', 'PUT', body);

    const responce = JSON.parse(data);

    if(responce.message != 'OK') {
        utility.fail(Endpoint);
        return;
    }

    await utility.backendCall(Endpoint + '?twitchId=' + twichId, 'GET').then(data => {
        const player = JSON.parse(data);

        if( player.name == body.name &&
            player.avatar == body.avatar &&
            player.twitchId == body.twitchId) {
                utility.pass(Endpoint);
            }
        else {
            utility.fail(Endpoint);
        }

    }).catch(error => {
        utility.fail(Endpoint);
    });
}

module.exports = test_get_player;