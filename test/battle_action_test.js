const utility = require('./utility');

const Endpoint = '/battle_action';

function validateBattleUpdate(battleUpdate) {
    return battleUpdate &&
    battleUpdate.player &&
    battleUpdate.monster &&
    battleUpdate.monster.maxHealth &&
    battleUpdate.steps &&
    Array.isArray(battleUpdate.steps);
}

async function test_battle_action() {
    const twitchId = utility.genId();
    const gameId = utility.genId();

    const body = {
        name: 'test player',
        avatar: 'ape.png',
        playerId: twitchId
    };

    try {
        let data = await utility.backendCall('/create_new_player?platform=twitch', 'PUT', body);
        let playerData = JSON.parse(data);

        data = await utility.backendCall(`/join_game?playerId=${playerData.playerId}&gameId=${gameId}`, 'POST');
        let gameState = JSON.parse(data);

        data = await utility.backendCall(`/start_battle?playerId=${playerData.playerId}&gameId=${gameId}&monsterId=${gameState.monsters[0].id}`, 'POST');
        const battleData = JSON.parse(data);

        data = await utility.backendCall(`${Endpoint}?battleId=${battleData.id}&actionType=strike`, 'POST');
        let battleUpdate = JSON.parse(data);

        if(!validateBattleUpdate(battleUpdate) || battleUpdate.player.strikeLevel != 1) {
            throw {data: "Battle update data malformed"};
        }

        data = await utility.backendCall(`${Endpoint}?battleId=${battleData.id}&actionType=strike`, 'POST');
        battleUpdate = JSON.parse(data);

        if(!validateBattleUpdate(battleUpdate) || battleUpdate.player.strikeLevel != 2) {
            throw {data: "Battle update data malformed"};
        }
        
        data = await utility.backendCall(`${Endpoint}?battleId=${battleData.id}&actionType=strike`, 'POST');
        battleUpdate = JSON.parse(data);

        if(!validateBattleUpdate(battleUpdate) || battleUpdate.player.strikeLevel != 0) {
            throw {data: "Battle update data malformed"};
        }
    }
    catch(error) {
        console.error(error.data.toString());
        utility.fail(Endpoint);
        return;
    }

    utility.pass(Endpoint);
}

module.exports = test_battle_action;