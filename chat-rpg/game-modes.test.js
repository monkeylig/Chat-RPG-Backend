const GameModes = require("./game-modes");
const MemoryBackedDataSource = require("../data-source/memory-backed-data-source");
const { Player } = require("./datastore-objects/agent");
const { MonsterClass } = require("./datastore-objects/monster-class");

beforeAll(() => {
    GameModes.numberOfMonsters = 1;
  });

test('Area game creation', async () => {
    let datasource = new MemoryBackedDataSource();
    await datasource.initializeDataSource({
        monsters: {
            skellington: {
                monsterNumber: 0,
                strengthRating: 0.5
            }
        }
    });

    let arenaGame = (await GameModes.arena.createGame(datasource)).getData();

    expect(arenaGame.mode).toMatch("arena");
    expect(arenaGame.monsters.length).toBe(GameModes.arena.numberOfStartingMonsters);
    expect(arenaGame.monsters[0]).toHaveProperty("strength");
    expect(arenaGame.monsters[0]).toHaveProperty("defense");
    expect(arenaGame.monsters[0]).toHaveProperty("id");

    datasource = new MemoryBackedDataSource();
    await datasource.initializeDataSource();

    arenaGame = (await GameModes.arena.createGame(datasource)).getData();

    expect(arenaGame.mode).toMatch(GameModes.arena.name);
    expect(arenaGame.monsters.length).toBe(0);
});

test('Arena game onMonsterDefeated', async () => {
    let datasource = new MemoryBackedDataSource();
    await datasource.initializeDataSource({
        monsters: {
            skellington: {
                monsterNumber: 0,
                strengthRating: 0.5
            }
        }
    });

    let arenaGame = (await GameModes.arena.createGame(datasource));
    let player = new Player();
    player.setStatsAtLevel(30);
    arenaGame.onPlayerJoin(player);

    await GameModes.arena.onMonsterDefeated(datasource, arenaGame, player, {});

    const game = arenaGame.datastoreObject;
    expect(game.monsters[5]).toBeDefined();
    expect(game.monsters[5].level).toBeLessThanOrEqual(32);
    expect(game.monsters[5].level).toBeGreaterThanOrEqual(1);
});

test('Arena game postProcessGameState', async () => {
    let datasource = new MemoryBackedDataSource();
    await datasource.initializeDataSource({
        monsters: {
            skellington: {
                monsterNumber: 0,
                strengthRating: 0.5
            }
        }
    });

    let arenaGame = (await GameModes.arena.createGame(datasource));
    let player = new Player();
    player.setStatsAtLevel(30);
    arenaGame.onPlayerJoin(player);

    await GameModes.arena.postProcessGameState(datasource, arenaGame, player);

    const game = arenaGame.datastoreObject;
    expect(game.monsters[5].level).toBe(31);
    expect(game.monsters[6].level).toBe(30);
    expect(game.monsters[7].level).toBe(29);
});

test('Battle Royal Create Game', async () => {
    let datasource = new MemoryBackedDataSource();
    await datasource.initializeDataSource({
        monsters: {
            skellington: {
                monsterNumber: 0,
                strengthRating: 0.5
            }
        }
    });

    let battleRoyal = (await GameModes.battleRoyal.createGame(datasource)).getData();

    expect(battleRoyal.mode).toMatch("battleRoyal");
    expect(battleRoyal.monsters.length).toBe(10);
    expect(battleRoyal.monsters[0].strengthRating).toBe(0.5);

    datasource = new MemoryBackedDataSource();
    await datasource.initializeDataSource();

    battleRoyal = (await GameModes.battleRoyal.createGame(datasource)).getData();

    expect(battleRoyal.mode).toMatch(GameModes.battleRoyal.name);
    expect(battleRoyal.monsters.length).toBe(0);
});

test('Battle Royal OnMonsterDefeated', async () => {
    let datasource = new MemoryBackedDataSource();
    await datasource.initializeDataSource({
        monsters: {
            skellington: {
                monsterNumber: 0,
                strengthRating: 0.5
            }
        }
    });

    const player = new Player();
    player.setStatsAtLevel(30);

    let battleRoyal = await GameModes.battleRoyal.createGame(datasource);
    GameModes.battleRoyal.onMonsterDefeated(datasource, battleRoyal, player, {});

    expect(battleRoyal.getData().monsters[10].name).toBe(player.getData().name);
    expect(battleRoyal.getData().monsters[10].weaponDropRate).toBe(0);

});