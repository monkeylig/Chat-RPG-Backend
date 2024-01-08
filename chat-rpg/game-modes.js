const Schema = require("./datasource-schema");
const {MonsterClass, Monster} = require('./datastore-objects/monster-class')
const Game = require('./datastore-objects/game');
const utility = require('./utility');

function randomInt(upper) {
    return Math.floor(Math.random() * upper);
}

async function getMonsterClassesByNumber(dataSource, monsterNumbers) {
    const monstersClasses = [];
    const monstersRef = dataSource.collection(Schema.Collections.Monsters);

    const monsterPromises = [];
    for(const monsterNumber of monsterNumbers) {
        monsterPromises.push(monstersRef.where(Schema.MonsterFields.MonsterNumber, '==', monsterNumber).get());
    }

    const querySnapshots = await Promise.all(monsterPromises);

    for(const querySnapshot of querySnapshots) {
        if(querySnapshot.empty) {
            continue;
        }
        
        const monsterClass = new MonsterClass(querySnapshot.docs[0].data());
        monstersClasses.push(monsterClass);
    }

    return monstersClasses;
}

async function getMonsterClassByNumber(dataSource, monsterNumber) {
    const monstersClasses = await getMonsterClassesByNumber(dataSource, [monsterNumber]);
    return monstersClasses[0];
}

async function ArenaCreateGame(dataSource, name, numberOfStartingMonsters) {
    const monstersClasses = [];
    const monstersRef = dataSource.collection(Schema.Collections.Monsters);

    for(let i=0; i < numberOfStartingMonsters; i++) {
        const querySnapshot = await monstersRef.where(Schema.MonsterFields.MonsterNumber, '==', randomInt(GameModes.numberOfMonsters)).get();
        if(querySnapshot.empty) {
            continue;
        }

        const monsterClass = new MonsterClass(querySnapshot.docs[0].data());
        monstersClasses.push(monsterClass);
    }

    const arenaGame = new Game({mode: name});

    monstersClasses.forEach(monsterClass => {
        arenaGame.addMonster(monsterClass.createMonsterInstance(1));
    })
    
    return arenaGame;
}

async function ArenaOnMonsterDefeated(dataSource, game, player, monster) {
    const monstersRef = dataSource.collection(Schema.Collections.Monsters);

    const querySnapshot = await monstersRef.where(Schema.MonsterFields.MonsterNumber, '==', randomInt(GameModes.numberOfMonsters)).get();
    if(querySnapshot.empty) {
        return;
    }

    const monsterClass = new MonsterClass(querySnapshot.docs[0].data());

    const newMonster = monsterClass.createMonsterInstance(utility.getRandomIntInclusive(1, player.getData().level + 2));
    game.addMonster(newMonster);
}

async function ArenaPostProcessGameState(dataSource, game, player) {
    const numberOfMonsters = 3;
    const monstersRef = dataSource.collection(Schema.Collections.Monsters);

    const monsterPromises = [];
    for(let i = 0; i < numberOfMonsters; i++) {
        monsterPromises.push(await monstersRef.where(Schema.MonsterFields.MonsterNumber, '==', randomInt(GameModes.numberOfMonsters)).get());
    }
    const querySnapshots = await Promise.all(monsterPromises);

    let monsterCount = 0;
    for(const querySnapshot of querySnapshots) {
        if(querySnapshot.empty) {
            continue;
        }
        
        const monsterClass = new MonsterClass(querySnapshot.docs[0].data());
        const newLevel = Math.max(1, player.getData().level + Math.floor(numberOfMonsters / 2) - monsterCount)
        game.addMonster(monsterClass.createMonsterInstance(newLevel));
        monsterCount += 1;
    }
}

async function BattleRoyalCreateGame(dataSource) {
    const battleRoyalGame = new Game({mode: 'battleRoyal'});
    const classNumbers = [];

    for(let i = 0; i < 10; i++) {
        classNumbers.push(randomInt(GameModes.numberOfMonsters));
    }

    const monsterClasses = await getMonsterClassesByNumber(dataSource, classNumbers);

    for(const monsterClass of monsterClasses) {
        const newMonster = monsterClass.createMonsterInstance(1);        
        battleRoyalGame.addMonster(newMonster);
    }

    return battleRoyalGame;
}

async function BattleRoyalOnMonsterDefeated(dataSource, game, player, monster) {
    const newMonster = new Monster(player.getData());
    newMonster.getData().weaponDropRate = 0;
    game.addMonster(newMonster);
}

async function BattleRoyalPostProcessGameState(dataSource, game, player) {
    const monsterClass = await getMonsterClassByNumber(dataSource, randomInt(GameModes.numberOfMonsters));
    if(!monsterClass) {
        return;
    }

    const newMonster = monsterClass.createMonsterInstance(player.getData().level);
    game.addMonster(newMonster);
}

const GameModes = {
    numberOfMonsters: 10,
    arena: {
        name: 'arena',
        numberOfStartingMonsters: 5,
        levelBias: 0,
        async createGame(dataSource) {
            return await ArenaCreateGame(dataSource, this.name, this.numberOfStartingMonsters);
        },
        onMonsterDefeated: ArenaOnMonsterDefeated,
        postProcessGameState: ArenaPostProcessGameState
    },
    battleRoyal: {
        name: 'battleRoyal',
        createGame: BattleRoyalCreateGame,
        onMonsterDefeated: BattleRoyalOnMonsterDefeated,
        postProcessGameState: BattleRoyalPostProcessGameState

    }
}

module.exports = GameModes;