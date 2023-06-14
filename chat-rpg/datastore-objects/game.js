const DatastoreObject = require('./datastore-object');
const chatRPGUtility = require('../utility');

class Game extends DatastoreObject {
    constructor(objectData) {
        super(objectData);

        this.datastoreObject.monsters = chatRPGUtility.unflattenObjectArray(this.datastoreObject.monsters);
    }

    constructNewObject(game) {
        game.monsters = [];
        game.mode = '';
        game.trackers = {
            levelSum: 0,
            numberOfPlayers: 0,
            averageLevel: 0,
            maxLevel: 0,
            minLevel: 0
        };
    }

    getData() {
        const newData = Object.assign({}, this.datastoreObject);
        newData.monsters = chatRPGUtility.flattenObjectArray(newData.monsters);
        return newData;
    }

    getUnflattenedData() {
        return this.datastoreObject;
    }

    findMonsterById(id, flatten=true) {
        return Game.findMonsterById(this.datastoreObject, id, flatten);
    }
    static findMonsterById(datastoreObject, id, flatten=true) {
        for(const monster of datastoreObject.monsters) {
            if(monster.id == id) {
                return flatten ? JSON.stringify(monster) : monster;
            }
        }
    }

    removeMonster(id) {
        const monsterIndex = this.datastoreObject.monsters.findIndex((element) => element.id === id);

        if(monsterIndex === -1) {
            return;
        }

        this.datastoreObject.monsters.splice(monsterIndex, 1);
    }

    getMonsters(flatten=true) {
        if (flatten) {
            return chatRPGUtility.flattenObjectArray(this.datastoreObject.monsters);
        }

        return this.datastoreObject.monsters;
    }

    addMonster(monster) {
        this.datastoreObject.monsters.push(monster.getData());
    }

    onPlayerJoin(player) {
        const playerData = player.datastoreObject;
        const gameDataTrackers = this.datastoreObject.trackers;

        gameDataTrackers.numberOfPlayers += 1;
        gameDataTrackers.levelSum += playerData.level;
        gameDataTrackers.averageLevel = Math.floor(gameDataTrackers.levelSum / gameDataTrackers.numberOfPlayers);
        gameDataTrackers.maxLevel = Math.max(gameDataTrackers.maxLevel, playerData.level);
        gameDataTrackers.minLevel = gameDataTrackers.minLevel === 0 ? playerData.level : Math.min(gameDataTrackers.minLevel, playerData.level);

    }
}

module.exports = Game;