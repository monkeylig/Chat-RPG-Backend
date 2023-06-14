const Schema = require("./datasource-schema");
const {MonsterClass} = require('./datastore-objects/monster-class')
const Game = require('./datastore-objects/game');
const utility = require('./utility');

const NumberOfMonsters = 1;

function randomInt(upper) {
    return Math.floor(Math.random() * upper);
}

async function ArenaCreateGame(name, numberOfStartingMonsters, dataSource) {
    const monstersClasses = [];
    const monstersRef = dataSource.collection(Schema.Collections.Monsters);

    for(let i=0; i < numberOfStartingMonsters; i++) {
        const querySnapshot = await monstersRef.where(Schema.MonsterFields.MonsterNumber, '==', randomInt(NumberOfMonsters)).get();
        if(querySnapshot.empty) {
            continue;
        }

        const monsterClass = new MonsterClass(querySnapshot.docs[0].data());
        monsterClass.setClassName(querySnapshot.docs[0].ref.id);
        monstersClasses.push(monsterClass);
    }

    const arenaGame = new Game({mode: name});

    monstersClasses.forEach(monsterClass => {
        arenaGame.addMonster(monsterClass.createMonsterInstance(1));
    })
    
    return arenaGame;
}

async function ArenaOnMonsterDefeated(game, levelBias, dataSource) {
    const monstersRef = dataSource.collection(Schema.Collections.Monsters);

    const querySnapshot = await monstersRef.where(Schema.MonsterFields.MonsterNumber, '==', randomInt(NumberOfMonsters)).get();
    if(querySnapshot.empty) {
        return;
    }

    const monsterClass = new MonsterClass(querySnapshot.docs[0].data());
    monsterClass.setClassName(querySnapshot.docs[0].ref.id);

    //We have our monster class, now we need to determine what level it should be
    const monsterLevelGrace = 5;
    let averageMonsters = 0;
    let minimumMonsters = 0;
    let maximumMonsters = 0;

    const gameData = game.datastoreObject;
    for(const monster of gameData.monsters) {
        //Do we have a monster at average level?
        if(Math.abs(monster.level - gameData.trackers.averageLevel) <= monsterLevelGrace) {
            averageMonsters += 1;
        }
        //Do we have a monster at minimum level?
        else if(Math.abs(monster.level - gameData.trackers.minLevel) <= monsterLevelGrace) {
            minimumMonsters += 1;
        }
        //Do we have a monster at maximum level?
        else if(Math.abs(monster.level - gameData.trackers.maxLevel) <= monsterLevelGrace) {
            maximumMonsters += 1;
        }
    }

    const minLevel = Math.max(1, gameData.trackers.minLevel + levelBias);
    const maxLevel = Math.max(1, gameData.trackers.maxLevel + levelBias);

    let newMonster = monsterClass.createMonsterInstance(utility.getRandomIntInclusive(minLevel, maxLevel));
    if(averageMonsters === 0) {
        newMonster = monsterClass.createMonsterInstance(Math.max(1, gameData.trackers.averageLevel + levelBias));
    }
    else if(minimumMonsters === 0) {
        newMonster = monsterClass.createMonsterInstance(minLevel);
    }
    else if(maximumMonsters === 0) {
        newMonster = monsterClass.createMonsterInstance(maxLevel);
    }

    game.addMonster(newMonster);
}

const GameModes = {
    arena: {
        name: 'arena',
        numberOfStartingMonsters: 5,
        levelBias: 0,
        async createGame(dataSource) {
            return await ArenaCreateGame(this.name, this.numberOfStartingMonsters, dataSource);
        },
        async onMonsterDefeated(game, monster, dataSource) {
            return await ArenaOnMonsterDefeated(game, this.levelBias, dataSource);
        }
    }
}

module.exports = GameModes;