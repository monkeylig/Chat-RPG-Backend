const utility = require('./utility');

const Endpoint = '/equip_ability';

async function test_equip_ability() {
    try {
        let data = await utility.backendCall(`${Endpoint}?playerId=testPlayer1&abilityBookName=Test Book 1&abilityIndex=0`, 'POST');
        let playerData = JSON.parse(data);
        
        if(playerData.abilities.length === 0) {
            utility.fail(Endpoint);
            return;
        }

    }
    catch (error) {
        console.error(error.data.toString());
        utility.fail(Endpoint);
        return;
    }

    utility.pass(Endpoint);
}

module.exports = test_equip_ability;