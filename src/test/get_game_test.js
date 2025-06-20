const utility = require('./utility');

const Endpoint = '/get_game';

async function test_get_game() {
    const twitchId = utility.genId();
    const gameId = utility.genId();

    const body = {
        name: 'test player',
        avatar: 'ape.png',
        playerId: twitchId
    };

    try {
        // Create Player
        let data = await utility.backendCall('/create_new_player?platform=twitch', 'PUT', body);
        let playerData = JSON.parse(data);

        // Join Game
        await utility.backendCall(`/join_game?playerId=${playerData.playerId}&gameId=${gameId}`, 'POST');

        // Get game update
        data = await utility.backendCall(`${Endpoint}?gameId=${gameId}`, 'GET');
        const gameState = JSON.parse(data);

        if(!gameState.hasOwnProperty('id') || !gameState.hasOwnProperty('monsters')) {
            utility.fail(Endpoint);
            return;
        }

        if(gameState.id != gameId) {
            utility.fail(Endpoint);
            return;
        }

        if(gameState.monsters.length <= 0) {
            utility.fail(Endpoint);
            return;
        }

        for (const monster of gameState.monsters) {
            if(!monster.hasOwnProperty('strengthRating') || !monster.hasOwnProperty('defenseRating') || !monster.hasOwnProperty('magicRating')) {
                utility.fail(Endpoint);
                return;
            }
        }
    }
    catch (error) {
        console.error(error.data.toString());
        utility.fail(Endpoint);
        return;
    }

    utility.pass(Endpoint);
}

module.exports = test_get_game;