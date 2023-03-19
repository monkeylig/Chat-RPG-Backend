const utility = require('./utility');

const Endpoint = '/start_battle';

async function test_start_battle() {
    const twitchId = Math.floor(Math.random() * 10000).toString();
    const gameId = Math.floor(Math.random() * 10000).toString();
    const body = {
        name: 'test player',
        avatar: 'ape.png',
        playerId: twitchId
    };

    let playerData;
    let gameState;

    try {
        let data = await utility.backendCall('/create_new_player?platform=twitch', 'PUT', body);
        playerData = JSON.parse(data);
        data = await utility.backendCall('/join_game'  + '?playerId=' + playerData.playerId + '&gameId=' + gameId, 'POST');
        gameState = JSON.parse(data);

        data = await utility.backendCall(Endpoint + '?playerId=' + playerData.playerId + '&gameId=' + gameId + '&monsterId=' + gameState.monsters[0].id, 'POST');
        const battleData = JSON.parse(data);

        if (!battleData || !battleData.player || !battleData.monster) {
            throw "Battle data malformed";
        }
    }
    catch (error) {
        utility.fail(Endpoint);
        return;
    }



    utility.pass(Endpoint)
}

module.exports = test_start_battle;