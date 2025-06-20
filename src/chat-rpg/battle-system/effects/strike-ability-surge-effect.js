/**
 * @import {BattleAgent} from "../../datastore-objects/battle-agent"
 * @import {BattleContext} from "../battle-context"
 * @import {ActionGeneratorObject} from "../action-generator"
 */

const { Effect } = require("../effect");

class StrikeAbilitySurgeEffect extends Effect {
    /**
     * @typedef {Object} StrikeAbilitySurgeEffectData
     * @property {number} roundsLeft
     * 
     * @param {BattleAgent} targetAgent 
     * @param {StrikeAbilitySurgeEffectData} inputData 
     */
    constructor(targetAgent, inputData) {
        super(targetAgent, inputData);
        this.name = 'Strike Ability Surge';
        this.unique = false;

        if (this._inputData.roundsLeft === undefined) {
            this._inputData.roundsLeft = 1;
        }
    }

    getInputData() {
        return /**@type {StrikeAbilitySurgeEffectData}*/(this._inputData);
    }

    /**
     * Called at the end of a round of battle round
     * @param {BattleContext} battleContext 
     * @returns {ActionGeneratorObject}
     */
    *battleRoundEndEvent(battleContext) {
        const inputData = /**@type {StrikeAbilitySurgeEffectData}*/(yield true);
        if (this.isEffectExpired(inputData)) {
            yield this.endEffectAction();
            return;
        }

        yield {
            playerAction: {
                targetPlayer: this.targetPlayer,
                strikeLevelChange: 2
            }
        };
    }
}

module.exports = {StrikeAbilitySurgeEffect};
