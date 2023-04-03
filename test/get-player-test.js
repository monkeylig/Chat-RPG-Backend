const utility = require('./utility');

const Endpoint = '/get_player';

async function test_get_player() {
    const twichId = utility.genId();
    const body = {
        name: 'test player',
        avatar: 'pig.png',
        playerId: twichId
    };

    let data;
    try {
        data = await utility.backendCall('/create_new_player?platform=twitch', 'PUT', body);
    }
    catch(error) {
        utility.fail(Endpoint);
    }

    await utility.backendCall(Endpoint + '?playerId=' + twichId + '&platform=' + 'twitch', 'GET').then(data => {
        const player = JSON.parse(data);

        if( player.name == body.name &&
            player.avatar == body.avatar &&
            player.twitchId == body.playerId) {
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