/**
 * @typedef {import("./action").Action} Action
 */

/** @enum {string} */
const ActionCreatorType =  {
    Strike: 'strike',
    Ability: 'ability',
    StrikeAbility: 'strikeAbility',
    Item: 'item',
    Effect: 'effect',
    None: '',
};

/**
 * @typedef {Generator<Action|boolean, void, Object>} ActionGeneratorObject
 */


class ActionGenerator {
    #inputData;
    #generator;
    /** @type {IteratorResult<Action|boolean, void> | null} */
    #lastYieldedValue;
    /**
     * Construct an new Action Generator
     * @param {ActionGeneratorObject} generator 
     */
    constructor(generator) {
        this.#inputData = {};
        this.#generator = generator;
        this.#lastYieldedValue = null;

    }

    /**
     * Returns the next action in the generator
     * @returns {IteratorResult<Action|boolean, void>} A promise that resolve to the next action in the generator
     */
    next() {
        if(this.#lastYieldedValue && this.#lastYieldedValue.value === true) {
            this.#lastYieldedValue = this.#generator.next(this.#inputData);
        }
        else {
            this.#lastYieldedValue = this.#generator.next();
        }
        return this.#lastYieldedValue;
    }

    get inputData() {
        return this.#inputData;
    }

    set inputData(newData) {
        this.#inputData = newData
    }

};

module.exports = {ActionGenerator, ActionCreatorType};