const Ability = require("../datastore-objects/ability");
const { BattleAgent } = require("../datastore-objects/battle-agent");
const { BattleMove } = require("./battle-move");
const { GeneratorCreatorType } = require("./battle-system-types");
const { BattleContext } = require("./battle-context");
const ActionGeneratorTypes = require("./action-generator");
const BattleAgentTypes = require("../datastore-objects/battle-agent");
const { generateAbilityActions } = require("./ability-utility");
const { PlayerActionType } = require("./action");
const { getTarget } = require("./utility");

class StrikeAbilityBattleMove extends BattleMove {
    /**
     * 
     * @param {BattleAgent} srcPlayer 
     */
    constructor(srcPlayer) {
        super(srcPlayer);
    }

    get creatorType() {
        return GeneratorCreatorType.StrikeAbility;
    }

    /**
     * @override
     * @returns {Ability.AbilityData}
     */
    getInputData() {
        return new Ability(this.owner.getData().weapon.strikeAbility).getData();
    }

    /**
     * @override
     * @param {BattleContext} battleContext 
     * @returns {ActionGeneratorTypes.ActionGeneratorObject}
     */
    *activate(battleContext) {
        const inputData = /**@type {Ability.AbilityData} */(yield true);
        const target = getTarget(this.owner, inputData.target, battleContext);

        if(!target) {
            return;
        }

        if (this.owner.getStrikeAbilityCost()) {
            yield {
                playerAction: {
                    targetPlayer: this.owner,
                    srcPlayer: this.owner,
                    apChange: -this.owner.getStrikeAbilityCost()
                }
            };
        }

        if (this.owner.getData().strikeLevel) {
            yield {
                playerAction: {
                    targetPlayer: this.owner,
                    srcPlayer: this.owner,
                    strikeLevelChange: -this.owner.getData().strikeLevel
                }
        };
        }

        yield {
            infoAction: {
                description: `${this.owner.getData().name} used ${inputData.name}!`,
                action: 'strikeAbility',
                targetAgentId: target.getData().id,
                srcAgentId: this.owner.getData().id
            }
        }

        for(const action of generateAbilityActions(this.owner, inputData, battleContext)) {
            yield action;
        }
    }
}

module.exports = {StrikeAbilityBattleMove};