const DatastoreObject = require('./datastore-object');
const {Monster} = require('./agent');

const utility = require("../../utility");

class MonsterClass extends DatastoreObject {
    constructor(objectData) {
        super(objectData);
    }

    constructNewObject(monster) {
        monster.abilities = [];
        monster.attackRating = 0;
        monster.magicRating = 0;
        monster.defenceRating = 0;
        monster.healthRating = 0;
        monster.avatar = '';
        monster.expYield = 0;
        monster.monsterNumber = 0;
        monster.name = '';
        monster.weapon = {};
    }

    createMonsterInstance(level) {
        const newMonster = new Monster({...this.datastoreObject, id: utility.genId()});
        newMonster.setStatsAtLevel(level);
        return newMonster;
    }
}

module.exports = MonsterClass;