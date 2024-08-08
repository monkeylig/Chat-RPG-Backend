/**
 * @import {BattleAgent} from "../../datastore-objects/battle-agent"
 */

const { Effect } = require("../effect");

class ImbueEffect extends Effect {
    /**
     * @typedef {Object} ImbueEffectData
     * @property {string} element
     * @property {number} roundsLeft
     * 
     * @param {BattleAgent} targetAgent 
     * @param {ImbueEffectData} inputData 
     */
    constructor(targetAgent, inputData) {
        super(targetAgent, inputData);

        this.name = "ImbuedWeapon";
        this.unique = false;

        if (!this._inputData.roundsLeft) {
            this._inputData.roundsLeft = 1;
        }
    }

    getInputData() {
        return /**@type {ImbueEffectData}*/(this._inputData);
    }
}

module.exports = {ImbueEffect};
