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
                attackRating: 0.5
            }
        }
    });

    let arenaGame = (await GameModes.arena.createGame(datasource)).getData();

    expect(arenaGame.mode).toMatch(GameModes.arena.name);
    expect(arenaGame.monsters.length).toBe(GameModes.arena.numberOfStartingMonsters);
    expect(arenaGame.monsters[0]).toHaveProperty("attack");
    expect(arenaGame.monsters[0]).toHaveProperty("defence");
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
                attackRating: 0.5
            }
        }
    });

    let arenaGame = (await GameModes.arena.createGame(datasource));
    let player = new Player();
    player.setStatsAtLevel(30);
    arenaGame.onPlayerJoin(player);
    player = new Player();
    player.setStatsAtLevel(15);
    arenaGame.onPlayerJoin(player);

    await GameModes.arena.onMonsterDefeated(arenaGame, {}, datasource);

    const game = arenaGame.datastoreObject;
    expect(game.monsters[5]).toBeDefined();
    expect(game.monsters[5].level).toBe(22);

    await GameModes.arena.onMonsterDefeated(arenaGame, {}, datasource);

    expect(game.monsters[6]).toBeDefined();
    expect(game.monsters[6].level).toBe(15);

    await GameModes.arena.onMonsterDefeated(arenaGame, {}, datasource);

    expect(game.monsters[7]).toBeDefined();
    expect(game.monsters[7].level).toBe(30);

    await GameModes.arena.onMonsterDefeated(arenaGame, {}, datasource);

    expect(game.monsters[8]).toBeDefined();
    expect(game.monsters[8].level).toBeLessThanOrEqual(30);
});