/**
 * @import {BattlePlayerData, BattleMonsterData} from "./battle-agent"
 * @import {EffectData} from "../battle-system/effect"
 */

const DatastoreObject = require("./datastore-object");

/**
 * @typedef {Object} DropItem
 * @property {string} type
 * @property {Object} content
 * @property {boolean} [bagFull]
 * 
 * @typedef {Object} BattleData
 * @property {BattlePlayerData} player
 * @property {BattleMonsterData} monster
 * @property {string} gameId
 * @property {Object} strikeAnim
 * @property {Object} environment
 * @property {number} round
 * @property {boolean} active
 * @property {EffectData[]} effects
 * @property {{status: string,
 * winner: string|null,
 * expAward: number,
 * levelGain: number,
 * drops: DropItem[]
 * }} [result]
 */

class Battle extends DatastoreObject {
    /**
     * 
     * @param {any} objectData 
     */
    constructor(objectData) {
        super(objectData);
    }

    /**
     * @override
     * @param {any} battle 
     */
    constructNewObject(battle) {
        battle.player = {};
        battle.monster = {};
        battle.gameId = '';
        battle.strikeAnim = {};
        battle.environment = {};
        battle.round = 0;
        battle.active = true;
        battle.effects = [];
    }

    /**
     * @override
     * @returns {BattleData}
     */
    getData() {
        return /**@type {BattleData}*/(this.datastoreObject);
    }
}

module.exports = {Battle};