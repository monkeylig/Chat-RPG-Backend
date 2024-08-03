/**
 * @import {AbilityData} from "../datastore-objects/ability"
 * @import {ActionGeneratorObject} from "./action-generator"
 */

const { BattleAgent } = require("../datastore-objects/battle-agent");
const { BattleMove } = require("./battle-move");
const { GeneratorCreatorType } = require("./battle-system-types");
const { BattleContext } = require("./battle-context");
const { generateAbilityActions } = require("./ability-utility");
const { PlayerActionType } = require("./action");
const Ability = require("../datastore-objects/ability");

class AbilityBattleMove extends BattleMove {
    #ability;
    /**
     * 
     * @param {BattleAgent} srcplayer 
     * @param {Ability} ability
     */
    constructor(srcplayer, ability) {
        super(srcplayer);
        this.#ability = ability;
    }

    get creatorType() {
        return GeneratorCreatorType.Ability;
    }

    /**
     * @override
     * @returns {AbilityData}
     */
    getInputData() {
        return this.#ability.getData();
    }

    /**
     * @override
     * @param {BattleContext} battleContext 
     * @returns {ActionGeneratorObject}
     */
    *activate(battleContext) {
        const inputData = /** @type {AbilityData} */ (yield true);

        const target = inputData.target === 'opponent' ? battleContext.getOpponent(this.owner) : this.owner;

        if(!target) {
            return;
        }

        const actionWord = inputData.type === PlayerActionType.Magical ? 'casts' : 'uses';

        yield {
            infoAction: {
                description: `${this.owner.getData().name} ${actionWord} ${inputData.name}!`,
                action: 'ability',
                targetAgentId: target.getData().id,
                srcAgentId: this.owner.getData().id,
            }
        };

        for(const action of generateAbilityActions(this.owner, inputData, battleContext)) {
            yield action;
        }

        if (inputData.apCost) {
            yield {
                playerAction: {
                    targetPlayer: this.owner,
                    srcPlayer: this.owner,
                    type: '',
                    style: '',
                    apChange: -inputData.apCost
                }
            };
        }

        const mainInputData = this.getInputData();
        if (mainInputData.charges && mainInputData.charges >= 0) {
            mainInputData.charges -= 1;

            if (mainInputData.charges <= 0) {
                yield {
                    playerAction: {
                        targetPlayer: this.owner,
                        srcPlayer: this.owner,
                        removeAbility: inputData.name
                    }
                };
            }
        }
    }
}

module.exports = {AbilityBattleMove};