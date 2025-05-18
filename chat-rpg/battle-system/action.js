/**
 * @import {ActionGenerator} from "./action-generator"
 * @import {BattleAgent} from "../datastore-objects/battle-agent"
 * @import {Effect, EffectData} from "./effect"
 * @import {AbilityData} from "../datastore-objects/ability"
 */

/**
 * @typedef {Object} Action
 * @property {PlayerAction} [playerAction]
 * @property {InfoAction} [infoAction]
 * @property {BattleContextAction} [battleContextAction]
 * @property {ActionGeneratorAction} [actionGeneratorAction]
 * @property {ActionModAction} [actionModAction]
 */

/** @enum {string} */
const PlayerActionType = {
    Physical: 'physical',
    Magical: 'magical',
    Natural: 'natural'
};

/** @enum {string} */
const PlayerActionStyle = {
    Sword: 'sword',
    Staff: 'staff',
    Dagger: 'dagger',
    Melee: 'melee',
    Natural: 'natural'
};

/** @enum {string} */
const TargetEnum = {
    Self: 'self',
    Opponent: 'opponent'
};

/** @enum {string} */
const ElementsEnum = {
    Fire: 'fire',
    Lightning: 'lightning',
    Water: 'water',
    Ice: 'ice'
};

/**
 * @typedef {Object} ProtectionData
 * @property {number} [physical]
 * @property {number} [magical]
 * 
 * @typedef {Object} AgentActionData
 * @property {PlayerActionType} [type] - The action's type
 * @property {PlayerActionStyle} [style] - The action's style
 * @property {number} [baseDamage] - The Base damage for attacks from one agent to another
 * @property {number} [trueDamage]
 * @property {number} [defensePen]
 * @property {number} [baseDamageChange]
 * @property {ElementsEnum[]} [elements]
 * @property {number} [strikeLevelChange]
 * @property {number} [maxApChange]
 * @property {number} [apChange]
 * @property {{
 * name: string,
 * location?: 'bag'|'inventory'}} [consumeItem]
 * @property {'bag'|'inventory'} [consumeItemLocation]
 * @property {number} [heal]
 * @property {number} [healPercent]
 * @property {number} [absorb]
 * @property {number} [recoil]
 * @property {number} [revive]
 * @property {ProtectionData} [protection]
 * @property {AbilityData} [addAbility]
 * @property {string} [removeAbility]
 * @property {number} [defenseAmp]
 * @property {number} [strengthAmp]
 * @property {number} [magicAmp]
 * @property {number} [weaponSpeedAmp]
 * @property {number} [lightningResistAmp]
 * @property {number} [fireResistAmp]
 * @property {number} [waterResistAmp]
 * @property {number} [iceResistAmp]
 * @property {string} [overrideDamageModifier]
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
 * @property {Effect} [removeEffect]
 * @property {EffectData} [addEffect]
 * @property {ActionGenerator} [removeActionGenerator]
 * @property {{
 * ability: AbilityData,
 * user: BattleAgent
 * }} [triggerAbility]
 * @property {string} [targetId]
 * @property {string} [action]
 */

/**
 * @callback ActionGeneratorModFunction
 * @param {Object} inputData
 */

/**
 * @typedef {Object} ActionGeneratorAction
 * @property {ActionGenerator} targetActionGenerator
 * @property {ActionGeneratorModFunction} modFunction 
 * @property {string} action
 * @property {string} targetId
 * @property {string} [description]
 */

/**
 * @typedef {Object} ActionModAction
 * @property {Action} targetAction
 * @property {ActionGeneratorModFunction} modFunction 
 * @property {string} action
 * @property {string} targetId
 * @property {string} [description]
 * 
 */

module.exports = {PlayerActionStyle, PlayerActionType, TargetEnum, ElementsEnum};