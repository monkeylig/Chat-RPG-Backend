/**
 * @typedef {import("../datastore-objects/battle-agent").BattlePlayerData} BattlePlayerData
 * @typedef {import("../datastore-objects/battle-agent").BattleMonsterData} BattleMonsterData
 */

/**
 * @typedef {Object} PlayerActionRequest
 * @property {string} battleId
 * @property {string} actionType
 * @property {string} [abilityName]
 * @property {string} [itemId]
 */

/**
 * @typedef {Object} BattleData
 * @property {BattlePlayerData} player
 * @property {BattleMonsterData} monster
 * @property {string} gameId
 * @property {Object} strikeAnim
 * @property {Object} environment
 * @property {number} round
 * @property {boolean} active
 * @property {string} id
 */

/**
 * 
 */
class BattleSystem {
    /**
     * 
     * @param {BattleData} battle 
     */
    constructor(battle) {

    }

    /**
     * Executes a move that a player has chosen to make
     * @param {PlayerActionRequest} playerActionRequest 
     */
    singlePlayerBattleIteration(playerActionRequest){
        
    }   
}