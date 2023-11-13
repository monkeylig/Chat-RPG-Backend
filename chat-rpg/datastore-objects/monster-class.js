const DatastoreObject = require('./datastore-object');
const {Agent} = require('./agent');

const utility = require("../../utility");
const { Weapon } = require('./weapon');
const chatRPGUtility = require('../utility');

class MonsterClass extends DatastoreObject {
    constructor(objectData) {
        super(objectData);
    }

    static setFields(monster) {
        monster.abilities = [];
        monster.strengthRating = 0.25;
        monster.magicRating = 0.25;
        monster.defenceRating = 0.25;
        monster.healthRating = 0.25;
        monster.avatar = '';
        monster.expYield = 0;
        monster.monsterNumber = 0;
        monster.name = 'Unknown Monster';
        monster.weapon = new Weapon(chatRPGUtility.defaultWeapon).getData();
        monster.weaponDropRate = 0.2;
        monster.class = '';
        monster.coinDrop = 3;
        monster.description = '';
    }

    constructNewObject(monster) {
        MonsterClass.setFields(monster);
    }

    createMonsterInstance(level) {
        const newMonster = new Monster({...this.datastoreObject, id: utility.genId()});
        newMonster.setStatsAtLevel(level);
        return newMonster;
    }
}

class Monster extends Agent {
    static EXP_MODIFIER = 6;
    static STAT_POINTS_PER_LEVEL = 5;

    constructor(objectData) {
        super(objectData);
    }

    constructNewObject(monster) {
        super.constructNewObject(monster);
        MonsterClass.setFields(monster);
        monster.id = '';
    }

    getExpGain() {
        const monster = this.datastoreObject;
        return Math.round(monster.expYield * monster.level/7 * Monster.EXP_MODIFIER);
    }

    setStatsAtLevel(level) {
        const monster = this.datastoreObject;
        Agent.setStatsAtLevel(monster, {
            maxHealth: monster.healthRating * Monster.STAT_POINTS_PER_LEVEL,
            strength: monster.strengthRating * Monster.STAT_POINTS_PER_LEVEL,
            defence: monster.defenceRating * Monster.STAT_POINTS_PER_LEVEL,
            magic: monster.magicRating * Monster.STAT_POINTS_PER_LEVEL,
        }, level);
    }
}

module.exports = {MonsterClass, Monster};