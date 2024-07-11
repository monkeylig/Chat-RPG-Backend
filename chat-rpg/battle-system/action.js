const { BattleAgent } = require("../datastore-objects/battle-agent");
const { BattleContext } = require("./battle-context");
const { Effect } = require("./effect");

/**
 * @typedef {Object} Action
 * @property {PlayerAction} [playerAction]
 * @property {InfoAction} [infoAction]
 * @property {BattleContextAction} [battleContextAction]
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

/** @enum {string} */
const TargetEnum = {
    Self: 'self',
    Opponent: 'opponent'
};

/**
 * @typedef {Object} AgentActionData
 * @property {PlayerActionType} [type] - The action's type
 * @property {PlayerActionStyle} [style] - The action's style
 * @property {number} [baseDamage] - The Base damage for attacks from one agent to another
 * @property {number} [strikeLevelChange]
 * @property {number} [apChange]
 * @property {string} [consumeItem]
 * @property {number} [heal]
 * @property {number} [revive]
 * @property {number} [defenceAmp]
 */

/**
 * @typedef {AgentActionData & {
 * targetPlayer: BattleAgent, // The agent to target
 * srcPlayer?: BattleAgent // The Agent performing this action
 * }} PlayerAction
 */

/**
 * @typedef {Object} InfoAction
 * @property {string} description
 * @property {string} [action]
 * @property {string} [srcAgentId]
 * @property {string} [targetAgentId]
 * @property {Object} [animation]
 */

/**
 * @typedef {Object} BattleContextAction
 * @property {BattleContext} battleContext
 * @property {Effect} [removeEffect]
 * @property {Effect} [addEffect]
 */

module.exports = {PlayerActionStyle, PlayerActionType, TargetEnum};