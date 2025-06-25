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
    let useAbility = chatRPGUtility.chance(0.7);

    const monsterData = monster.getData();
    if(useAbility && monsterData.abilities.length > 0 && monsterData.level > 1) {
        const choice = chatRPGUtility.getRandomIntInclusive(0, Math.min(monsterData.abilities.length - 1, Math.floor(monsterData.level/5)));
        
        const ability = new Ability(monsterData.abilities[choice]);
        let apCost = ability.getData().apCost;
        if(apCost !== undefined && monsterData.ap >= apCost) {
            return {
                type: 'ability',
                abilityName: ability.getData().name,
            };
        }
    }

    return {
        type: 'strike',
    };
}

const monsterAi = {
    genericAi: genericAi
}

module.exports = monsterAi;