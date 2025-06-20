const utility = require('./utility');

const Endpoint = '/drop_weapon';

async function test_drop_weapon() {
    try {
        let data = await utility.backendCall(`${Endpoint}?playerId=testPlayer2&weaponId=weapon1`, 'POST');
        let playerData = JSON.parse(data);

        if(!playerData.bag.weapons.hasOwnProperty('length') || playerData.bag.weapons.length > 0) {
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

module.exports = test_drop_weapon;