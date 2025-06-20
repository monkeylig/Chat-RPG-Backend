const utility = require('./utility');

const Endpoint = '/equip_weapon';

async function test_equip_weapon() {
    try {
        let data = await utility.backendCall(`${Endpoint}?playerId=testPlayer1&weaponId=weapon1`, 'POST');
        let playerData = JSON.parse(data);

        if(playerData.weapon.name != 'Glock19') {
            utility.fail(Endpoint);
            return;
        }
    }
    catch (error) {
        console.error(error.data.toString());
        utility.fail(Endpoint);
    }

    utility.pass(Endpoint);
}

module.exports = test_equip_weapon;