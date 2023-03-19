const GameModes = require("./game-modes");
const MemoryBackedDataSource = require("../data-source/memory-backed-data-source");

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

    let arenaGame = await GameModes.arena.createGame(datasource);

    expect(arenaGame.mode).toMatch(GameModes.arena.name);
    expect(arenaGame.monsters.length).toBe(GameModes.arena.NumberOfStartingMonsters);
    expect(arenaGame.monsters[0]).toHaveProperty("attack");
    expect(arenaGame.monsters[0]).toHaveProperty("defence");
    expect(arenaGame.monsters[0]).toHaveProperty("id");

    datasource = new MemoryBackedDataSource();
    await datasource.initializeDataSource();

    arenaGame = await GameModes.arena.createGame(datasource);

    expect(arenaGame.mode).toMatch(GameModes.arena.name);
    expect(arenaGame.monsters.length).toBe(0);
});
