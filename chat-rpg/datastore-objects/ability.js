const DatastoreObject = require('./datastore-object');
const animations = require('../content/animations');

class Ability extends DatastoreObject {
    constructor(objectData) {
        super(objectData);
    }

    constructNewObject(ability) {
        ability.name = 'nothing';
        ability.baseDamage = 0;
        ability.baseDamageTextModifier = '';
        ability.speed = 0;
        ability.effectName = '';
        ability.apCost = 0;
        ability.apGain = 0;
        ability.type = 'physical';
        ability.style = 'sword';
        ability.strengthAmp = 0;
        ability.targetStrengthAmp = 0;
        ability.defenseAmp = 0;
        ability.targetDefenseAmp = 0;
        ability.magicAmp = 0;
        ability.targetMagicAmp = 0;
        ability.speedAmp = 0;
        ability.weaponSpeedAmp = 0;
        ability.targetWeaponSpeedAmp = 0;
        ability.absorb = 0;
        ability.recoil = 0;
        ability.empowerment = {
            magical: 0,
            physical: 0
        };
        ability.protection = {
            magical: 0,
            physical: 0
        };
        ability.description = 'This is an empty default ability.';
        ability.effectName = '';
        ability.animation = null;
        ability.specialStats = {};
        ability.elements = [];
        ability.ablazeChance = 0;
        ability.fireResistAmp = 0;
        ability.targetFireResistAmp = 0;
        ability.lightningResistAmp = 0;
        ability.targetLightningResistAmp = 0;
        ability.waterResistAmp = 0;
        ability.targetWaterResistAmp = 0;
        ability.iceResistAmp = 0;
        ability.targetIceResistAmp = 0;
        ability.defensePen = 0;
        ability.imbue = {
            fire: null,
            lightning: null,
            water: null,
            ice: null,
        };
        ability.isCounter = false;
        ability.overrideDamageModifier = null;
        ability.charges = null;
        ability.addAbilities = []
        ability.addAbilityStrikes = [];
        ability.setCounterAbility = null;
        ability.target = 'opponent';
    }

    getSpecialStat(stat, defaultValue = 0) {
        if(!this.datastoreObject.specialStats.hasOwnProperty(stat)) {
            return defaultValue;
        }

        return this.datastoreObject.specialStats[stat];
    }

    hasElement(element) {
        if(this.datastoreObject.elements.find((e) => e === element)) {
            return true;
        }

        return false;
    }
}

module.exports = Ability;