const utility = require("../utility");
const Schema = require("./datasource-schema");
const chatRPGUtility = require('./utility');

const NumberOfMonsters = 1;
const StatPointsPerLevel = 5;

function randomInt(upper) {
    return Math.floor(Math.random() * upper);
}

function createMonsterInstance(monsterClass, level) {

    const newMonster = Object.assign({
        id: utility.genId()
    }, monsterClass);

    chatRPGUtility.setStatsAtLevel(newMonster, {
        maxHealth: monsterClass.healthRating * StatPointsPerLevel,
        attack: monsterClass.attackRating * StatPointsPerLevel,
        defence: monsterClass.defenceRating * StatPointsPerLevel,
        magic: monsterClass.magicRating * StatPointsPerLevel,
    }, level);
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