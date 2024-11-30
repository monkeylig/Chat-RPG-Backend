const DatastoreObject = require('./datastore-object');
const chatRPGUtility = require('../utility');
const { FieldValue } = require('../../data-source/backend-data-source');

class Game extends DatastoreObject {
    constructor(objectData) {
        super(objectData);
    }

    constructNewObject(game) {
        game.monsters = [];
        game.mode = '';
        game.name = 'Legion Slayer';
        game.description = '';
        game.metadata = {};
        game.trackers = {
            levelSum: 0,
            numberOfPlayers: 0,
            averageLevel: 0,
            maxLevel: 0,
            minLevel: 0
        };
        game.created = FieldValue.Timestamp

    }

    findMonsterById(id, flatten=true) {
        return Game.findMonsterById(this.datastoreObject, id);
    }
    static findMonsterById(datastoreObject, id,) {
        for(const monster of datastoreObject.monsters) {
            if(monster.id == id) {
                return monster;
            }
        }
    }

    removeMonster(id) {
        const monsterIndex = this.datastoreObject.monsters.findIndex((element) => element.id === id);

        if(monsterIndex === -1) {
            return;
        }

        return this.datastoreObject.monsters.splice(monsterIndex, 1)[0];
    }

    getMonsters() {
        return this.datastoreObject.monsters;
    }

    addMonster(monster) {
        this.datastoreObject.monsters.push(monster.getData());
    }

    onPlayerJoin(player) {
        const playerData = player.datastoreObject;
        const gameDataTrackers = this.datastoreObject.trackers;

        gameDataTrackers.numberOfPlayers += 1;
        this.#updateLevelTrackers(playerData.level);
    }

    onPlayerLevelUp(oldLevel, player) {
        const gameDataTrackers = this.datastoreObject.trackers;

        gameDataTrackers.levelSum -= oldLevel;
        this.#updateLevelTrackers(player.datastoreObject.level);
    }

    #updateLevelTrackers(newLevel) {
        const gameDataTrackers = this.datastoreObject.trackers;

        gameDataTrackers.levelSum += newLevel;
        gameDataTrackers.averageLevel = Math.floor(gameDataTrackers.levelSum / gameDataTrackers.numberOfPlayers);
        gameDataTrackers.maxLevel = Math.max(gameDataTrackers.maxLevel, newLevel);
        gameDataTrackers.minLevel = gameDataTrackers.minLevel === 0 ? newLevel : Math.min(gameDataTrackers.minLevel, newLevel);
    }
}

module.exports = Game;