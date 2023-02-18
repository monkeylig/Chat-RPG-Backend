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
    data = await utility.backendCall('/create_new_player?platform=twitch', 'PUT', body);

    const responce = JSON.parse(data);

    if(responce.message != 'OK') {
        utility.fail(Endpoint);
        return;
    }

    await utility.backendCall(Endpoint + '?playerId=' + twitchId + '&gameId=' + gameId, 'POST', null, {'chat-rpg-platform': 'twitch'})
    .then(data => {
        const gameState = JSON.parse(data);
        if(!gameState.hasOwnProperty('player')) {
            utility.fail(Endpoint);
            return;
        }
        if(!gameState.hasOwnProperty('game')) {
            utility.fail(Endpoint);
            return;
        }

        if(gameState.player.twitchId != twitchId || gameState.player.currentGameId != gameId || gameState.game.gameId != gameId) {
            utility.fail(Endpoint);
            return;
        }

        utility.pass(Endpoint)
    }).catch(error => {
        utility.fail(Endpoint);
    });
}

module.exports = test_join_game;