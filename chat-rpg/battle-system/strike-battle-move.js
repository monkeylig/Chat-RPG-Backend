/**
 * @import {ActionGeneratorObject} from "./action-generator"
 * @import {AbilityData} from "../datastore-objects/ability"
 */
const animations = require("../content/animations");
const Ability = require("../datastore-objects/ability");
const { BattleAgent } = require("../datastore-objects/battle-agent");
const chatRPGUtility = require("../utility");
const { generateAbilityActions } = require("./ability-utility");
const { PlayerActionType, PlayerActionStyle, TargetEnum } = require("./action");
const { ActionGenerator } = require("./action-generator");
const { BattleContext } = require("./battle-context");
const { BattleMove } = require("./battle-move");
const { GeneratorCreatorType } = require("./battle-system-types");

/**
 * @typedef {AbilityData & {
 * strikeData: {apChange: number, strikeLevelChange: number}
 * }} StrikeBattleMoveData
 */

class StrikeBattleMove extends BattleMove {
    /**
     * 
     * @param {BattleAgent} srcplayer 
     */
    constructor(srcplayer) {
        super(srcplayer);
    }

    /**
     * @returns {GeneratorCreatorType}
     */
    get creatorType() {
        return GeneratorCreatorType.Strike;
    }

    /**
     * @override
     * @returns {StrikeBattleMoveData}
     */
    getInputData() {
        const strike = new Ability({
            baseDamage: this.owner.getData().weapon.baseDamage,
            type: this.owner.getData().weapon.type,
            style: this.owner.getData().weapon.style,
            target: TargetEnum.Opponent,
            animation: animations.yellowHit
        });
        return {
            ...strike.getData(),
            strikeData: {
                apChange: 1,
                strikeLevelChange: 1
            }
        };
    }
    
    /**
     * @override
     * @param {BattleContext} battleContext 
     * @returns {ActionGeneratorObject}
     */
    *activate(battleContext){
        const inputData = /** @type {StrikeBattleMoveData} */ (yield true);
        const target = inputData.target === 'opponent' ? battleContext.getOpponent(this.owner) : this.owner;
        
        if(!target) {
            return;
        }

        yield {
            infoAction: {
                description: `${this.owner.getData().name} strikes ${target.getData().name}!`,
                action: 'strike',
                targetAgentId: target.getData().id,
                srcAgentId: this.owner.getData().id,
                animation: chatRPGUtility.strikeAnim
            }
        };

        for(const action of generateAbilityActions(this.owner, inputData, battleContext)) {
            yield action;
        }

        yield {
            playerAction: {
                srcPlayer: this.owner,
                targetPlayer: this.owner,
                apChange: inputData.strikeData.apChange,
                strikeLevelChange: inputData.strikeData.strikeLevelChange
            }
        };
    }
}

module.exports = {StrikeBattleMove};