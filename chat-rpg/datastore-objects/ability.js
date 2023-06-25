const DatastoreObject = require('./datastore-object');
const chatRPGUtility = require('../utility');

class Ability extends DatastoreObject {
    constructor(objectData) {
        super(objectData);
    }

    constructNewObject(ability) {
        ability.name = 'nothing';
        ability.baseDamage = 0;
        ability.speed = 0;
        ability.effectName = '';
        ability.apCost = 1;
        ability.type = 'physical';
        ability.style = 'sword';
        ability.attackAmp = 0;
        ability.defenceAmp = 0;
        ability.magicAmp = 0;
        ability.speedAmp = 0;
        ability.weaponSpeedAmp = 0;
        ability.absorb = 0;
        ability.recoil = 0;
        ability.empowerment = {
            strike: 0
        };
        ability.description = 'This is an empty default ability.';
        ability.effectName = '';
        ability.animation = chatRPGUtility.strikeAnim;
        ability.specialStats = {};
    }

    getSpecialStat(stat, defaultValue = 0) {
        if(!this.datastoreObject.specialStats.hasOwnProperty(stat)) {
            return defaultValue;
        }

        return this.datastoreObject.specialStats[stat];
    }
}

module.exports = Ability;