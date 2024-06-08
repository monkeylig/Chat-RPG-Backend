const { ActionGenerator } = require("./action-generator");

/**
 * @typedef {import("./action").Action} Action
 */

class BattleContext {
    /** @type {BattleData} */
    #battle;
    /** @type {ActionGenerator[]} */
    #actionGeneratorStack;
    /** @type {Action[]} */
    #actionStack;

    /**
     * 
     * @param {BattleData} battle 
     */
    constructor(battle) {
        this.#battle = battle;
        this.#actionGeneratorStack = [];
        this.#actionStack = [];
    }

    /**
     * Returns the ActionGenerator stack
     * @returns {ActionGenerator[]}
     */
    getActionGeneratorStack() {
        return this.#actionGeneratorStack;
    }

    /**
     * Returns the Action stack
     * @returns {Action[]}
     */
    getActionStack() {
        return this.#actionStack;
    }

    /**
     * Get the ActionGenerator at the top of the ActionGenerator stack
     * @returns {ActionGenerator | undefined}
     */
    getTopActionGenerator() {
        return this.#getTopOfStack(this.#actionGeneratorStack);
    }

    /**
     * Adds and new ActionGenerator to the battle context at the top of the ActionGenerator stack
     * @param {ActionGenerator} actionGenerator 
     */
    pushActionGenerator(actionGenerator) {
        this.#pushStack(this.#actionGeneratorStack, actionGenerator);
    }

    /**
     * Remove the ActionGenerator from the top of the ActionGenerator stack and return it
     * @returns {ActionGenerator | undefined}
     */
    popActionGenerator() {
        return this.#popStack(this.#actionGeneratorStack)
    }

    /**
     * Get the Action at the top of the Action stack
     * @returns {Action | undefined}
     */
    getTopAction() {
        return this.#getTopOfStack(this.#actionStack);
    }

    /**
     * Adds and new Action to the battle context at the top of the Action stack
     * @param {Action} action 
     */
    pushAction(action) {
        this.#pushStack(this.#actionStack, action);
    }

    /**
     * Remove the Action from the top of the Action stack and return it
     * @returns {Action | undefined}
     */
    popAction() {
        return this.#popStack(this.#actionStack)
    }

    #getTopOfStack(stack) {
        if(stack.length < 1) {
            return;
        }
        return stack[0];
    }

    #pushStack(stack, actionGenerator) {
        stack.push(actionGenerator);
    }

    #popStack(stack) {
        return stack.pop();
    }
}

module.exports = {BattleContext};