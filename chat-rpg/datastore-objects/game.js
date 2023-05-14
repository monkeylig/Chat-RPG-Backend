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
        for(const monster of this.datastoreObject.monsters) {
            if(monster.id == id) {
                return flatten ? JSON.stringify(monster) : monster;
            }
        }
    }

    addMonster(monster) {
        this.datastoreObject.monsters.push(monster.getData());
    }
}

module.exports = Game;