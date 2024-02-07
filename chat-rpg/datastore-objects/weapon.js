const DatastoreObject = require('./datastore-object');
const chatRPGUtility = require('../utility');

class Weapon extends DatastoreObject {
    static Type = {
        Physical: 'physical',
        Magical: 'magical'
    }

    constructor(objectData) {
        super(objectData);
    }

    constructNewObject(weapon) {
        weapon.name = 'Unknown';
        weapon.instanceNumber = 0;
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
            strength: 1,
            magic: 1,
            defense: 1
        };
        weapon.description = 'Unknown',
        weapon.icon = 'sword-icon.png'
    }
}

module.exports = {Weapon};