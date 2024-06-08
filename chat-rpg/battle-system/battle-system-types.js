const {ActionGenerator} = require("./action-generator");

/**
 * @typedef {import("./action").Action} Action
 */

/** @enum {string} */
const GeneratorCreatorType =  {
    Strike: 'strike',
    Ability: 'ability',
    StrikeAbility: 'strikeAbility',
    Item: 'item',
    Effect: 'effect',
    None: '',
};

class ActionGeneratorCreator {
    /**
     * @returns {GeneratorCreatorType}
     */
    get creatorType() {
        return GeneratorCreatorType.None;
    }

    getInputData() {}
}

/**
 * @typedef {Object} ActiveActionGenerator
 * @property {Action} generator
 * @property {ActionGeneratorCreator} creator
 */

/**
 * @typedef {Object} ActiveAction
 * @property {Action} action
 * @property {ActionGenerator} generator
 * @property {ActionGeneratorCreator} creator
 */

module.exports = {GeneratorCreatorType, ActionGeneratorCreator};