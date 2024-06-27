const Ability = require("../datastore-objects/ability");
const { BattleMonster, BattlePlayer, BattleAgent } = require("../datastore-objects/battle-agent");
const chatRPGUtility = require("../utility");

/**
 * 
 * @param {BattleMonster} monster 
 * @param {BattleAgent} opponent 
 * @param {import("../battle-system/battle-system").BattleData} battle 
 * @returns {import("../battle-system/battle-system").PlayerActionRequest}
 */
function genericAi(monster, opponent, battle) {
    let choice = chatRPGUtility.getRandomIntInclusive(0, 1);

    const monsterData = monster.getData();
    if(choice === 1 && monsterData.abilities.length > 0) {
        choice = chatRPGUtility.getRandomIntInclusive(0, monsterData.abilities.length - 1);
        
        const ability = new Ability(monsterData.abilities[choice]);
        if(monsterData.ap >= ability.getData().apCost) {
            return {
                type: 'ability',
                abilityName: ability.getData().name,
                battleId: battle.id
            };
        }
    }

    return {
        type: 'strike',
        battleId: battle.id
    };
}

const monsterAi = {
    genericAi: genericAi
}

module.exports = monsterAi;