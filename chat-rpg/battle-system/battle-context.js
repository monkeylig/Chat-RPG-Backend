const {Effect} = require("./effect");
const { ActionGeneratorCreator } = require("./battle-system-types");
const { ActionGenerator } = require("./action-generator");
const chatRPGUtility = require("../utility");
const {ActionExecutor} = require("./action-executor");
const { BattlePlayer, BattleMonster, BattleAgent } = require("../datastore-objects/battle-agent");
const { BattleMove } = require("./battle-move");


/**
 * @typedef {import("./action").Action} Action
 * @typedef {import("./battle-system").BattleData} BattleData
 * @typedef {import("./battle-system-types").ActiveActionGenerator} ActiveActionGenerator
 * @typedef {import("./battle-system-types").ActiveAction} ActiveAction
 * @typedef {import("./battle-steps").BattleStep} BattleStep
 */

class BattleContext {
    /** @type {BattleData} */
    #battle;
    /** @type {ActiveActionGenerator[]} */
    #actionGeneratorStack;
    /** @type {ActiveAction[]} */
    #actionStack;
    /** @type {Effect[]} */
    #effects;

    /**
     * 
     * @param {BattleData} [battle] 
     */
    constructor(battle) {

        if (!battle) {
            battle = {
                player: new BattlePlayer({id: 'player'}).getData(),
                monster: new BattleMonster({id: 'monster'}).getData(),
                gameId: '',
                strikeAnim: {},
                environment: {},
                round: 0,
                active: true,
                id: ''
            };
        }
        this.player = new BattlePlayer(battle.player);
        this.monster = new BattleMonster(battle.monster);
        this.#battle = battle;
        this.#actionGeneratorStack = [];
        this.#actionStack = [];
        this.#effects = [];
    }

    /**
     * 
     * @param {BattleAgent} battleAgent 
     */
    getOpponent(battleAgent) {
        if (battleAgent.getData().id === this.player.getData().id) {
            return this.monster;
        }

        if (battleAgent.getData().id === this.monster.getData().id) {
            return this.player;
        }
    }

    /**
     * 
     * @param {BattleMove} battleMove 
     */
    activateBattleMove(battleMove) {
        this.addActionGenerator(battleMove.onActivate(this), battleMove);
    }
    /**
     * @returns {BattleStep[]}
     */
    resolve() {
        /** @type {BattleStep[]} */
        const battleSteps = [];
        while(this.getActionGeneratorStack().length > 0) {
            const topActionGenerator = this.getTopActionGenerator();
            const topAction = this.getTopAction();

            if(!topActionGenerator) {
                continue;
            }

            if(!topAction || topActionGenerator.generator != topAction.generator) {
                const yieldedAction = topActionGenerator.generator.next();
                const action = yieldedAction.value;
                if(yieldedAction.done) {
                    this.popActionGenerator();
                    this.sendEffectEvent((_effect) => _effect.onActionGeneratorEnd(this, topActionGenerator));
                }
                else if(typeof(action) == "object") {
                    this.addAction(action, topActionGenerator.generator, topActionGenerator.creator);
                }
            }
            else {
                const actionBattleSteps = ActionExecutor.execute(topAction.action);
                battleSteps.push(...actionBattleSteps);
                this.popAction();
                this.sendEffectEvent((_effect) => _effect.onActionEnd(this, topAction, actionBattleSteps));
            }
        }

        this.#battle.player = this.player.getData();
        this.#battle.monster = this.monster.getData();
        return battleSteps;
    }

    /**
     * 
     * @param {ActionGenerator} actionGenerator 
     * @param {ActionGeneratorCreator} actionGeneratorCreator 
     */
    addActionGenerator(actionGenerator, actionGeneratorCreator) {
        /** @type {ActiveActionGenerator[]} */
        const stagingEventStack = [{generator: actionGenerator, creator: actionGeneratorCreator}];

        while(stagingEventStack.length > 0) {
            let newActiveGenerator = stagingEventStack.pop();
            if (!newActiveGenerator) {
                continue;
            }
            
            const firstYield = newActiveGenerator.generator.next();
            if (firstYield.value !== true) {
                continue;
            }
            
            this.pushActionGenerator(newActiveGenerator);

            for(const effect of this.getActiveEffects()) {
                const generator = effect.onActionGeneratorBegin(this, newActiveGenerator);
                stagingEventStack.push({generator: generator, creator: effect});
            }

        }
    }

    /**
     * 
     * @param {Action} action 
     * @param {ActionGenerator} actionGenerator 
     * @param {ActionGeneratorCreator} actionGeneratorCreator 
     */
    addAction(action, actionGenerator, actionGeneratorCreator) {
        /** @type {ActiveAction} */
        const newAction = {action: action, generator: actionGenerator, creator: actionGeneratorCreator};
        this.pushAction(newAction);

        this.sendEffectEvent((_effect) => _effect.onActionBegin(this, newAction));
    }

    /**
     * 
     * @param {(event: Effect) => ActionGenerator} eventFunction 
     */
    sendEffectEvent(eventFunction) {
        for(const effect of this.getActiveEffects()) {
            this.addActionGenerator(eventFunction(effect), effect);
        }
    }

    /**
     * 
     * @param {Effect} effect 
     */
    addEffect(effect) {
        this.#effects.push(effect);
    }

    /**
     * 
     * @param {Effect} effect 
     * @returns {Effect | undefined}
     */
    removeEffect(effect) {
        return chatRPGUtility.findAndRemoveFromArray(this.#effects, effect);
    }

    /**
     * 
     * @returns {Effect[]}
     */
    getActiveEffects() {
        return this.#effects;
    }

    /**
     * Returns the ActionGenerator stack
     * @returns {ActiveActionGenerator[]}
     */
    getActionGeneratorStack() {
        return this.#actionGeneratorStack;
    }

    /**
     * Returns the Action stack
     * @returns {ActiveAction[]}
     */
    getActionStack() {
        return this.#actionStack;
    }

    /**
     * Get the ActionGenerator at the top of the ActionGenerator stack
     * @returns {ActiveActionGenerator | undefined}
     */
    getTopActionGenerator() {
        return this.#getTopOfStack(this.#actionGeneratorStack);
    }

    /**
     * Adds and new ActionGenerator to the battle context at the top of the ActionGenerator stack
     * @param {ActiveActionGenerator} actionGenerator 
     */
    pushActionGenerator(actionGenerator) {
        this.#pushStack(this.#actionGeneratorStack, actionGenerator);
    }

    /**
     * Remove the ActionGenerator from the top of the ActionGenerator stack and return it
     * @returns {ActiveActionGenerator | undefined}
     */
    popActionGenerator() {
        return this.#popStack(this.#actionGeneratorStack)
    }

    /**
     * Get the Action at the top of the Action stack
     * @returns {ActiveAction | undefined}
     */
    getTopAction() {
        return this.#getTopOfStack(this.#actionStack);
    }

    /**
     * Adds and new Action to the battle context at the top of the Action stack
     * @param {ActiveAction} action 
     */
    pushAction(action) {
        this.#pushStack(this.#actionStack, action);
    }

    /**
     * Remove the Action from the top of the Action stack and return it
     * @returns {ActiveAction | undefined}
     */
    popAction() {
        return this.#popStack(this.#actionStack)
    }

    /**
     * @template {Object} Ttype
     * @param {Ttype[]} stack 
     * @returns {Ttype | undefined}
     */
    #getTopOfStack(stack) {
        if(stack.length == 0) {
            return;
        }
        return stack[stack.length - 1];
    }

    /**
     * @template {Object} Ttype
     * @param {Ttype[]} stack 
     * @param {Ttype} actionGenerator 
     */
    #pushStack(stack, actionGenerator) {
        stack.push(actionGenerator);
    }

    /**
     * @template {Object} Ttype
     * @param {Ttype[]} stack 
     * @returns {Ttype | undefined}
     */
    #popStack(stack) {
        return stack.pop();
    }

    get battle() {
        return this.#battle;
    }
}

module.exports = {BattleContext};