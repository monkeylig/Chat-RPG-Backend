const Schema = require("./datasource-schema")

const NumberOfMonsters = 1;
const StatPointsPerLevel = 10;

function randomInt(upper) {
    return Math.floor(Math.random() * upper);
}

function createMonsterInstance(monsterClass, level) {
    const totalPoints = StatPointsPerLevel * level;

    const newMonster = Object.assign({
        attack: monsterClass.attackRating * totalPoints,
        defence: monsterClass.defenceRating * totalPoints,
        magic: monsterClass.magicRating * totalPoints,
        level: level
    }, monsterClass);

    return newMonster;
}

const GameModes = {
    arena: {
        name: 'arena',
        NumberOfStartingMonsters: 5,
        async createGame(dataSource) {
            const monstersClasses = [];
            const monstersRef = dataSource.collection(Schema.Collections.Monsters);

            for(let i=0; i<this.NumberOfStartingMonsters; i++) {
                const querySnapshot = await monstersRef.where(Schema.MonsterFields.MonsterNumber, '==', randomInt(NumberOfMonsters)).get();
                if(querySnapshot.empty) {
                    continue;
                }

                monstersClasses.push(querySnapshot.docs[0].data());
            }

            const arenaGame = {
                mode: this.name,
                monsters: []
            };

            for(monsterClass of monstersClasses) {
                arenaGame.monsters.push(createMonsterInstance(monsterClass, 1));
            }

            return arenaGame;
        }
    }
}

module.exports = GameModes;