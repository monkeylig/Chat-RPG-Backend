const DatastoreObject = require('./datastore-object');

class Ability extends DatastoreObject {
    constructor(objectData) {
        super(objectData);
    }

    constructNewObject(ability) {
        ability.name = 'nothing';
        ability.damage = 0;
        ability.speed = 0;
        ability.effectName = '';
        ability.apCost = 1;
    }
}

module.exports = Ability;