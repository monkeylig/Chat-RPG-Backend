const DatastoreObject = require('./datastore-object');
const {BattleAgent} = require('./battle-agent')
const chatRPGUtility = require('../utility');

class Weapon extends DatastoreObject {
    constructor(objectData) {
        super(objectData);
    }

    constructNewObject(weapon) {
        weapon.name = 'Unknown';
        weapon.type = 'physical';
        weapon.style = 'sword';
        weapon.baseDamage = 0;
        weapon.speed = 0;
        weapon.strikeAbility = {
            name: 'Unknown',
            type: 'physical',
            style: 'sword',
            baseDamage: 0,
            weaponSpeedAmp: 0,
            empowerment: {
                strike: 0
            },
            description: 'Unknown',
            animation: chatRPGUtility.strikeAnim
        };
        weapon.statGrowth = {
            maxHealth: 1,
            attack: 1,
            magic: 1,
            defence: 1
        };
        weapon.description = 'Unknown',
        weapon.icon = 'sword-icon.png'
    }
}

class BattleWeapon extends Weapon {
    constructNewObject(weapon) {
        super.constructNewObject(weapon);
        weapon.speedAmp = 0;
    }

    speedAmp(stages) {
        return BattleAgent.statAmp(this.datastoreObject, 'speedAmp', stages)
    }

    getModifiedSpeed() {
        return BattleAgent.getModifiedStat(this.datastoreObject, 'speed', 'speedAmp');
    }
}

module.exports = {Weapon, BattleWeapon};