/**
 * @import {AbilityData} from "../../datastore-objects/ability"
 * @import {ActionGeneratorObject} from "../action-generator"
 * @import {ActiveActionGenerator} from "../battle-system-types"
 * @import {BattleContext} from "../battle-context"
 */

const Ability = require("../../datastore-objects/ability");
const { BattleAgent } = require("../../datastore-objects/battle-agent");
const { Effect } = require("../effect");
const { GeneratorCreatorType } = require('../battle-system-types');
const { BattleMove } = require("../battle-move");
const { generateMoveActions } = require("../ability-utility");

class AbilityStrikeEffect extends Effect {

    /**
     * @typedef {Object} AbilityStrikeData
     * @property {number} strikeDuration
     * @property {AbilityData} ability
     * 
     * @param {BattleAgent} targetAgent 
     * @param {AbilityStrikeData} inputData 
     */
    constructor(targetAgent, inputData) {
        super(targetAgent, inputData)

        this.name = "Strike+";
        this.unique = false;

        if (!this._inputData.strikeDuration) {
            this._inputData.strikeDuration = 1;
        }

        this._inputData.ability = new Ability(inputData.ability).getData();
    }

    getInputData() {
        return /**@type {AbilityStrikeData}*/(this._inputData);
    }

    /**
     * Called when an ActionGenerator completed all of its actions and was removed from the battle system in
     * the battle system. This function generates the actions that respond the event
     * @param {BattleContext} battleContext 
     * @param {ActiveActionGenerator} actionGenerator 
     * @returns {ActionGeneratorObject}
     */
    *actionGeneratorEndEvent(battleContext, actionGenerator) {
        if (actionGenerator.creator.creatorType !== GeneratorCreatorType.Strike) {
            return;
        }

        const battleMove = /**@type {BattleMove} */(actionGenerator.creator);

        if (battleMove.owner !== this.targetPlayer) {
            return;
        }

        const inputData = /**@type {AbilityStrikeData}*/(yield true);

        yield* generateMoveActions(this.targetPlayer, inputData.ability, battleContext);

        this.getInputData().strikeDuration -= 1;

        if (this.getInputData().strikeDuration <= 0) {
            yield {
                battleContextAction: {
                    removeEffect: this
                }
            };
        }
    }
}

module.exports = {AbilityStrikeEffect};