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

    getInputData() {
        return {};
    }
}

/**
 * @typedef {Object} ActiveActionGenerator
 * @property {ActionGenerator} generator
 * @property {ActionGeneratorCreator} creator
 */

/**
 * @typedef {Object} ActiveAction
 * @property {Action} action
 * @property {ActionGenerator} generator
 * @property {ActionGeneratorCreator} creator
 */

module.exports = {GeneratorCreatorType, ActionGeneratorCreator};