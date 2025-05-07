/** @import {ItemData} from "../datastore-objects/item" */
/** @import {ActionGeneratorObject} from "./action-generator" */

const { BattleAgent } = require("../datastore-objects/battle-agent");
const Item = require("../datastore-objects/item");
const { generateAbilityActions } = require("./ability-utility");
const { BattleContext } = require("./battle-context");
const { BattleMove } = require("./battle-move");
const { GeneratorCreatorType } = require("./battle-system-types");

class ItemBattleMove extends BattleMove{
    #item;
    /**
     * 
     * @param {BattleAgent} srcPlayer 
     * @param {Item} item 
     * @param {'bag'|'inventory'} location
     */
    constructor(srcPlayer, item, location='bag') {
        super(srcPlayer);
        this.#item = item;
        this.location = location;
    }

    get creatorType() {
        return GeneratorCreatorType.Item;
    }

    /**
     * @override
     * @returns {ItemData}
     */
    getInputData() {
        return this.#item.getData();
    }

    /** 
     * @override
     * @param {BattleContext} battleContext
     * @returns {ActionGeneratorObject}
     */
    *activate(battleContext) {
        const inputData = /** @type {ItemData} */ (yield true);

        const target = inputData.target === 'opponent' ? battleContext.getOpponent(this.owner) : this.owner;

        if(!target) {
            return;
        }

        yield {
            infoAction: {
                description: `${this.owner.getData().name} used a ${inputData.name}!`,
                action: 'item',
                targetAgentId: target.getData().id,
                srcAgentId: this.owner.getData().id,
            }
        };

        let itemUsed = true;
        for(const action of generateAbilityActions(this.owner, inputData, battleContext, {skipAnimation: true})) {
            if (action.infoAction && action.infoAction.action === 'unsuccessful') {
                itemUsed = false;
            }
            yield action;
        }

        if(itemUsed && inputData.name) {
            yield {
                playerAction: {
                    targetPlayer: this.owner,
                    srcPlayer: this.owner,
                    consumeItem: {
                        name: inputData.name,
                        location: this.location
                    },
                    consumeItemLocation: this.location
                }
            };
        }
    }
}

module.exports = {ItemBattleMove};