const DatastoreObject = require('./datastore-object');

class Item extends DatastoreObject {
    constructor(objectData) {
        super(objectData);
    }

    constructNewObject(item) {
        item.name = 'nothing';
        item.icon = 'potion.png';
        item.count = 1;
        item.effectName = '';
        item.heal = 0;
        item.description = 'A useful Item.';
        item.outOfBattle = false;
        item.imbue = {
            fire: null,
            lightning: null,
            water: null,
            ice: null,
        };
        item.apGain = 0;
        item.apReduce = 0;
        item.strikeLevelChange = 0;
        item.relativeRecoil = 0;
        item.strengthAmp = 0;
        item.targetStrengthAmp = 0;
        item.defenseAmp = 0;
        item.targetDefenseAmp = 0;
        item.magicAmp = 0;
        item.targetMagicAmp = 0;
        item.speedAmp = 0;
        item.weaponSpeedAmp = 0;
        item.targetWeaponSpeedAmp = 0;
    }

    isDepleted() {
        return Item.isDepleted(this.datastoreObject);
    }

    static isDepleted(datastoreObject) {
        return datastoreObject.count <= 0;
    }

    onUsed() {
        Item.onUsed(this.datastoreObject);
    }

    static onUsed(datastoreObject) {
        if(!Item.isDepleted(datastoreObject)) {
            datastoreObject.count -= 1;
        }
    }
}

module.exports = Item;