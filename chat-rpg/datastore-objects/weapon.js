const DatastoreObject = require('./datastore-object');
const chatRPGUtility = require('../utility');

/**
 * @typedef {Object} WeaponData
 * @property {string} name
 * @property {number} instanceNumber
 * @property {string} type
 * @property {string} style
 * @property {number} baseDamage
 * @property {number} speed
 * @property {Object} strikeAbility
 * @property {Object} statGrowth
 * @property {string} description
 * @property {string} icon
 */

/**
 * A class representing a Weapon
 */
class Weapon extends DatastoreObject {

    /**
     * 
     * @param {Object} objectData 
     */
    constructor(objectData) {
        super(objectData);
    }

    /**
     * 
     * @param {Object} weapon 
     */
    constructNewObject(weapon) {
        /** @type {WeaponData} */
        const weaponData = {
            name: 'Unknown',
            instanceNumber: 0,
            type: 'physical',
            style: 'sword',
            baseDamage: 0,
            speed: 0,
            strikeAbility: {},
            statGrowth: {
                maxHealth: 1,
                strength: 1,
                magic: 1,
                defense: 1
            },
            description: 'Unknown',
            icon: 'sword-icon.png'
        };
        weapon = weaponData;
    }
}

module.exports = {Weapon};