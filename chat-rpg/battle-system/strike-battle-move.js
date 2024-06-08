const { BattleAgent } = require("../datastore-objects/battle-agent");
const { PlayerActionType, PlayerActionStyle } = require("./action");
const { ActionCreatorType, ActionGenerator } = require("./action-generator");
const { BattleMove } = require("./battle-move");

/**
 * @typedef {import("./action-generator").ActionGeneratorObject} ActionGeneratorObject
 */

/**
 * @typedef {Object} StrikeBattleMoveData
 * @property {BattleAgent} targetPlayer
 * @property {PlayerActionType} type - The action's type
 * @property {PlayerActionStyle} style - The action's style
 * @property {number} baseDamage
 */

class StrikeBattleMove extends BattleMove {
    #targetPlayer;
    /**
     * 
     * @param {BattleAgent} srcplayer 
     * @param {BattleAgent} targetPlayer
     */
    constructor(srcplayer, targetPlayer) {
        super(srcplayer);
        this.#targetPlayer = targetPlayer;
        this.creatorType = ActionCreatorType.Strike;
    }

    /**
     * @override
     * @returns {StrikeBattleMoveData}
     */
    getInputData() {
        /** @type {StrikeBattleMoveData} */
        const strikeData = {
            targetPlayer: this.#targetPlayer,
            type: this.owner.getData().weapon.type,
            style: this.owner.getData().weapon.style,
            baseDamage: this.owner.getData().weapon.baseDamage
        };
        return strikeData;
    }
    
    activate(battleContext){
        return new ActionGenerator(this.strike());
    }

    /**
     * @returns {ActionGeneratorObject}
     */
    *strike() {
        const inputData = /** @type {StrikeBattleMoveData} */ (yield true);
        yield {
            playerAction: {
                srcPlayer: this.owner,
                targetPlayer: inputData.targetPlayer,
                type: inputData.type,
                style: inputData.style,
                baseDamage: inputData.baseDamage
            }
        };
    }
}

module.exports = {StrikeBattleMove};