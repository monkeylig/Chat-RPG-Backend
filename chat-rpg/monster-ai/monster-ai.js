/**
 * @import {PlayerActionRequest} from "../battle-system/battle-system"
 * @import {BattleData} from "../datastore-objects/battle"
 * @import {BattleMonster, BattleAgent} from "../datastore-objects/battle-agent"
 */

const Ability = require("../datastore-objects/ability");
const chatRPGUtility = require("../utility");

/**
 * 
 * @param {BattleMonster} monster 
 * @param {BattleAgent} opponent 
 * @param {BattleData} battle 
 * @returns {PlayerActionRequest}
 */
function genericAi(monster, opponent, battle) {
    let choice = chatRPGUtility.getRandomIntInclusive(0, 1);

    const monsterData = monster.getData();
    if(choice === 1 && monsterData.abilities.length > 0) {
        choice = chatRPGUtility.getRandomIntInclusive(0, monsterData.abilities.length - 1);
        
        const ability = new Ability(monsterData.abilities[choice]);
        const apCost = ability.getData().apCost;
        if(apCost && monsterData.ap >= apCost) {
            return {
                type: 'ability',
                abilityName: ability.getData().name,
                battleId: ''
            };
        }
    }

    return {
        type: 'strike',
        battleId: ''
    };
}

const monsterAi = {
    genericAi: genericAi
}

module.exports = monsterAi;