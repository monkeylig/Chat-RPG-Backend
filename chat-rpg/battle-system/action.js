const { BattleAgent } = require("../datastore-objects/battle-agent");

/**
 * @typedef {Object} Action
 * @property {PlayerAction} [playerAction]
 * @property {InfoAction} [infoAction]
 */

/** @enum {string} */
const PlayerActionType = {
    Physical: 'physical',
    Magical: 'magical'
};

/** @enum {string} */
const PlayerActionStyle = {
    Sword: 'sword',
    Staff: 'staff'
};

/**
 * @typedef {Object} PlayerAction
 * @property {BattleAgent} srcPlayer - The Base damage for attacks from one agent to another
 * @property {BattleAgent} targetPlayer - The Base damage for attacks from one agent to another
 * @property {PlayerActionType} type - The action's type
 * @property {PlayerActionStyle} style - The action's style
 * @property {number} [baseDamage] - The Base damage for attacks from one agent to another
 */

/**
 * @typedef {Object} InfoAction
 * @property {string} description
 * @property {string} [action]
 */

module.exports = {PlayerActionStyle, PlayerActionType};