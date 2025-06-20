/** @import {AgentActionData, TargetEnum} from "../battle-system/action" */
const DatastoreObject = require('./datastore-object');
const animations = require('../content/animations');

/** 
 * @typedef {AgentActionData & {
 * target: TargetEnum,
 * animation?: object,
 * customActions?: {name: string, data: object}[],
 * addEffect?: {class: string, inputData?: object},
 * empowerment?: {physical?: number, magical?: number}
 * }} AbilityActionData
 * 
 * @typedef {AbilityActionData & {
 * name?: string,
 * description?: string,
 * baseDamageTextModifier?: string
 * speed?: number,
 * priority?: number,
 * apCost?: number,
 * postActions?: AbilityActionData[],
 * charges?: number,
 * }} AbilityData
 */

class Ability extends DatastoreObject {
    constructor(objectData) {
        super(objectData);
    }

    constructNewObject(ability) {
        Ability.constructNewObject(ability);
    }
    static constructNewObject(ability) {
        ability.name = 'nothing';
        ability.target = 'opponent';
        ability.baseDamage = 0;
        ability.trueDamage = 0;
        ability.customActions = null;
        ability.addEffect = null;
        ability.empowerment = null;
        ability.baseDamageText = null;
        ability.speed = 0;
        ability.priority = 0;
        ability.apChange = 0;
        ability.maxApChange = 0;
        ability.strikeLevelChange = 0;
        ability.apCost = 0;
        ability.postActions = [],
        ability.elements = [];
        ability.type = 'physical';
        ability.style = 'sword';
        ability.strengthAmp = 0;
        ability.defenseAmp = 0;
        ability.magicAmp = 0;
        ability.speedAmp = 0;
        ability.weaponSpeedAmp = 0;
        ability.heal = 0;
        ability.healPercent = 0;
        ability.absorb = 0;
        ability.recoil = 0;
        ability.protection = null;
        ability.description = 'This is an empty default ability.';
        ability.animation = null;
        ability.fireResistAmp = 0;
        ability.lightningResistAmp = 0;
        ability.waterResistAmp = 0;
        ability.iceResistAmp = 0;
        ability.defensePen = 0;
        ability.isCounter = false;
        ability.overrideDamageModifier = null;
        ability.charges = -1;
        ability.addAbility = null;
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

    /**
     * @override
     * @returns {AbilityData}
     */
    getData() {
        return /** @type {AbilityData} */ (this.datastoreObject);
    }
}

module.exports = Ability;