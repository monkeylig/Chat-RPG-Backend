/**
 * @import {WeaponData} from './weapon'
 * @import {AgentData} from './agent'
 */

const DatastoreObject = require('./datastore-object');
const {Agent} = require('./agent');

const utility = require("../../utility");
const { Weapon } = require('./weapon');
const chatRPGUtility = require('../utility');
const { EXP_LEVEL_CAP } = require('../battle-system/utility');

/** 
 * @typedef {Object} MonsterClassData
 * @property {Object[]} abilities
 * @property {{
 * maxHealth: number,
 * strength: number,
 * magic: number,
 * defense: number,
 * }} nature
 * @property {{
 * maxHealth: number,
 * strength: number,
 * magic: number,
 * defense: number,
 * }} talent
 * @property {{
 * type: string,
 * content: object,
 * dropRate: number
 * }[]} drops
 * @property {string} avatar
 * @property {number} expYield
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
        monster.nature = {
            maxHealth: 12,
            strength: 12,
            magic: 12,
            defense: 12,
        };
        monster.talent = {
            maxHealth: 1,
            strength: 1,
            magic: 1,
            defense: 1,
        };
        monster.drops = [];
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
        const monsterClassData = this.getData();
        const nature = monsterClassData.nature;
        const newMonster = new Monster({
            ...monsterClassData,
            id: utility.genId(),
            maxHealth: nature.maxHealth,
            health: nature.maxHealth,
            strength: nature.strength,
            magic: nature.magic,
            defense: nature.defense
        });
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
        const monster = this.getData();
        // May not need to cap the difficulty of leveling up. We'll see.
        //const restrictedLevel = Math.min(monster.level, EXP_LEVEL_CAP);
        return Math.round(monster.expYield * monster.level/7 * Monster.EXP_MODIFIER);
    }

    setStatsAtLevel(level) {
        const monsterData = this.getData();
        Agent.setStatsAtLevel(monsterData, level, monsterData.talent);
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