const Schema = require("./datasource-schema");
const {MonsterClass, Monster} = require('./datastore-objects/monster-class')
const Game = require('./datastore-objects/game');
const utility = require('./utility');
const { genId } = require("../utility");
const { IBackendDataSource } = require("../data-source/backend-data-source");
const { BattleAgent } = require("./datastore-objects/battle-agent");

const AUTO_GAME_MODE = "arena";

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

    const arenaGame = new Game({mode: 'arena', name: 'Arena', description: GameModes.arena.description});

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
    const battleRoyalGame = new Game({mode: 'battleRoyal', name: "Battle Royal", description: GameModes.battleRoyal.description});
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

/**
 * 
 * @param {IBackendDataSource} dataSource 
 * @param {Game} game 
 * @param {BattleAgent} player 
 * @param {Monster} monster 
 */
async function BattleRoyalOnMonsterDefeated(dataSource, game, player, monster) {
    const newMonster = new Monster(player.getData());
    const monsterData = newMonster.getData();
    monsterData.weaponDropRate = 0;
    monsterData.id = genId();
    monsterData.expYield = 36;
    monsterData.coinDrop = 3;
    monsterData.health = monsterData.maxHealth;
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

async function AutoCreateGame(dataSource) {
    const game = await GameModes[AUTO_GAME_MODE].createGame(dataSource);
    game.getData().mode = 'auto';
    game.getData().metadata.mode = AUTO_GAME_MODE;
    return game;
}

async function AutoOnPlayerJoin(dataSource, game, player) {
    if(game.getData().metadata.mode != AUTO_GAME_MODE) { //Reset game to current game mode
        const newGame = await GameModes[AUTO_GAME_MODE].createGame(dataSource);
        game.resetData(newGame.getData());
    }
}

async function AutoOnMonsterDefeated(dataSource, game, player, monster) {
    return await GameModes[AUTO_GAME_MODE].onMonsterDefeated(dataSource, game, player, monster);
}

async function AutoPostProcessGameState(dataSource, game, player) {
    return await GameModes[AUTO_GAME_MODE].postProcessGameState(dataSource, game, player);
}


const GameModes = {
    numberOfMonsters: 10,
    auto: {
        name: 'auto',
        createGame: AutoCreateGame,
        onPlayerJoin: AutoOnPlayerJoin,
        onMonsterDefeated: AutoOnMonsterDefeated,
        postProcessGameState: AutoPostProcessGameState,
    },
    arena: {
        name: 'Area',
        numberOfStartingMonsters: 5,
        levelBias: 0,
        async createGame(dataSource) {
            return await ArenaCreateGame(dataSource, this.name, this.numberOfStartingMonsters);
        },

        onPlayerJoin: async()=>{},
        onMonsterDefeated: ArenaOnMonsterDefeated,
        postProcessGameState: ArenaPostProcessGameState,
        description: "Fight hordes of endlessly spawning monsters!"
    },
    battleRoyal: {
        name: 'Battle Royale',
        createGame: BattleRoyalCreateGame,
        onPlayerJoin: async()=>{},
        onMonsterDefeated: BattleRoyalOnMonsterDefeated,
        postProcessGameState: BattleRoyalPostProcessGameState,
        description: "Defeat a monster, then a doppelganger of yourself will take it's place!"

    }
}

module.exports = GameModes;