const Ability = require("../datastore-objects/ability");
const chatRPGUtility = require("../utility");

function genericAi(monster, opponent, battle) {
    /*let choice = chatRPGUtility.getRandomIntInclusive(0, 1);

    const monsterData = monster.getData();
    if(choice === 1 && monsterData.abilities.length > 0) {
        choice = chatRPGUtility.getRandomIntInclusive(0, monsterData.abilities.length - 1);
        
        const ability = new Ability(monsterData.abilities[choice]);
        if(monsterData.ap >= ability.getData().apCost) {
            return {
                type: 'ability',
                abilityName: ability.getData().name
            };
        }
    }*/

    return {type: 'strike'};
}

const monsterAi = {
    genericAi: genericAi
}

module.exports = monsterAi;