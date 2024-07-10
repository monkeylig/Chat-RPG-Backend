/**
 * @import {WeaponData} from './weapon'
 * @import {AgentData} from './agent'
 */

const DatastoreObject = require('./datastore-object');
const {Agent} = require('./agent');

const utility = require("../../utility");
const { Weapon } = require('./weapon');
const chatRPGUtility = require('../utility');

/** 
 * @typedef {Object} MonsterClassData
 * @property {Object[]} abilities
 * @property {number} strengthRating
 * @property {number} magicRating
 * @property {number} defenseRating
 * @property {number} healthRating
 * @property {string} avatar
 * @property {string} expYield
 * @property {number} monsterNumber
 * @property {string} name
 * @property {WeaponData} weapon
 * @property {number} weaponDropRate
 * @property {string} class
 * @property {number} coinDrop
 * @property {string} description
 */

class MonsterClass extends DatastoreObject {
    constructor(objectData) {
        super(objectData);
    }

    static setFields(monster) {
        monster.abilities = [];
        monster.strengthRating = 0.25;
        monster.magicRating = 0.25;
        monster.defenseRating = 0.25;
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

    /**
     * @override
     * @returns {MonsterClassData}
     */
    getData() {
        return /** @type {MonsterClassData} */ (this.datastoreObject);
    }
}

/**
 * @typedef {MonsterClassData & AgentData & {
 * id: string
 * }} MonsterData
 */
class Monster extends Agent {
    static EXP_MODIFIER = 6;
    static STAT_POINTS_PER_LEVEL = 5;

    constructor(objectData) {
        super(objectData);
    }

    constructNewObject(monster) {
        MonsterClass.setFields(monster);
        monster.id = '';
        super.constructNewObject(monster);
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
            defense: monster.defenseRating * Monster.STAT_POINTS_PER_LEVEL,
            magic: monster.magicRating * Monster.STAT_POINTS_PER_LEVEL,
        }, level);
    }

    /**
     * @override
     * @returns {MonsterData}
     */
    getData() {
        return /** @type {MonsterData} */ (this.datastoreObject);
    }
}

module.exports = {MonsterClass, Monster};