const Schema = require("./datasource-schema");
const MonsterClass = require('./datastore-objects/monster-class')
const Game = require('./datastore-objects/game');

const NumberOfMonsters = 1;

function randomInt(upper) {
    return Math.floor(Math.random() * upper);
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

                monstersClasses.push(new MonsterClass(querySnapshot.docs[0].data()));
            }

            const arenaGame = new Game({mode: this.name});

            monstersClasses.forEach(monsterClass => {
                arenaGame.addMonster(monsterClass.createMonsterInstance(1));
            })
            
            return arenaGame;
        }
    }
}

module.exports = GameModes;