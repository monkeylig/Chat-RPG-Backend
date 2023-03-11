const utility = require('./utility');

const Endpoint = '/join_game';

async function test_join_game() {
    const twitchId = Math.floor(Math.random() * 10000).toString();
    const gameId = Math.floor(Math.random() * 10000).toString();
    const body = {
        name: 'test player',
        avatar: 'pig.png',
        playerId: twitchId
    };

    let data;

    try {
        data = await utility.backendCall('/create_new_player?platform=twitch', 'PUT', body);
    }
    catch (error) {
        utility.fail(Endpoint);
    }

    const responce = JSON.parse(data);

    await utility.backendCall(Endpoint + '?playerId=' + responce.playerId + '&gameId=' + gameId, 'POST')
    .then(data => {
        const gameState = JSON.parse(data);
        if(!gameState.hasOwnProperty('gameId') || !gameState.hasOwnProperty('monsters')) {
            utility.fail(Endpoint);
            return;
        }

        if(gameState.gameId != gameId) {
            utility.fail(Endpoint);
            return;
        }

        if(gameState.monsters.length <= 0) {
            utility.fail(Endpoint);
            return;
        }

        let failed = false;
        gameState.monsters.forEach(element => {
            if(!element.hasOwnProperty('attackRating') || !element.hasOwnProperty('defenceRating') || !element.hasOwnProperty('magicRating')) {
                failed = true;
                return;
            }
        });

        if(failed) {
            utility.fail(Endpoint);
            return;
        }

        utility.pass(Endpoint)
    }).catch(error => {
        utility.fail(Endpoint);
    });
}

module.exports = test_join_game;