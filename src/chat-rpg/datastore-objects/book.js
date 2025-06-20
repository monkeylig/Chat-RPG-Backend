/**
 * @import {BattleAgent} from './battle-agent'
 * @import {BattleData} from './battle'
 * @import {AbilityData} from './ability'
 */

const DatastoreObject = require('./datastore-object');

/**
 * @typedef {Object} BookRequirementData
 * @property {string} description
 * @property {number} requiredCount
 * @property {number} count
 * @property {{
 * type: string,
 * value: string,
 * level: number
 * }} tracker
 */

class BookRequirement extends DatastoreObject {
    constructor(objectData) {
        super(objectData);
    }

    constructNewObject(requirement) {
        requirement.description = 'Fulfill this requirement to unlock this ability.';
        requirement.requiredCount = 0;
        requirement.count = 0;
        requirement.tracker = {type: '', value: ''};
    }

    static #incrementRequirement(datastoreObject) {
        datastoreObject.count = Math.min(datastoreObject.count + 1, datastoreObject.requiredCount);
    }

    updateAbilityRequirement(owner, battleUpdate) {
        return BookRequirement.updateAbilityRequirement(this.getData(), owner, battleUpdate);
    }

    /**
     * returns true if the ability has just become unlocked
     * @param {BookRequirementData} datastoreObject 
     * @param {BattleAgent} owner 
     * @param {BattleData} battleUpdate 
     * @returns 
     */
    static updateAbilityRequirement(datastoreObject, owner, battleUpdate) {
        if (!battleUpdate.result) {
            return false;
        }

        if(BookRequirement.isMet(datastoreObject)) {
            return false;
        }

        const tracker = datastoreObject.tracker;
        const monsterSlain = battleUpdate.result.winner === owner.getData().id;

        switch(tracker.type) {
            case 'weaponStyleVictory':
                const levelReq = tracker.level ? tracker.level : 0;
                if(monsterSlain && owner.getData().weapon.style === tracker.value && battleUpdate.monster.level >= levelReq) {
                    BookRequirement.#incrementRequirement(datastoreObject);
                }
                break;
        }

        return BookRequirement.isMet(datastoreObject);
    }

    isMet() {
        return BookRequirement.isMet(this.datastoreObject);
    }

    static isMet(datastoreObject) {
        return datastoreObject.count >= datastoreObject.requiredCount;
    }

    /**
     * @override
     * @returns {BookRequirementData}
     */
    getData() {
        return /**@type {BookRequirementData}*/(this.datastoreObject);
    }
}

/**
 * @typedef {Object} BookData
 * @property {string} name
 * @property {number} instanceNumber
 * @property {string} icon
 * @property {string} description
 * @property {{
 * requirements: BookRequirementData[],
 * ability: AbilityData
 * }[]} abilities
 */

class Book extends DatastoreObject {
    constructor(objectData) {
        super(objectData);
    }

    constructNewObject(book) {
        book.name = '';
        book.instanceNumber = 0;
        book.icon = '';
        book.description = 'Ability books contain new abilities for Legion Slayers to learn through battles.';
        book.abilities = [];
    }

    updateAbilityRequirements(owner, battleUpdate) {
        return Book.updateAbilityRequirements(this.datastoreObject, owner, battleUpdate);
    }

    // Return an array containing the abilities that just unlocked
    static updateAbilityRequirements(datastoreObject, owner, battleUpdate) {
        const unlockedAbilities = [];
        for(const ability of datastoreObject.abilities) {
            if(!ability.requirements) {
                continue;
            }
            
            let isAbilityUnlocked = true;
            let justUnlocked = false;
            for(const requirement of ability.requirements) {
                if (BookRequirement.updateAbilityRequirement(requirement, owner, battleUpdate)) {
                    justUnlocked = true;
                }
                if (!BookRequirement.isMet(requirement)) {
                    isAbilityUnlocked = false;
                }
            }
            if(isAbilityUnlocked && justUnlocked) {
                unlockedAbilities.push(ability);
            }
        }

        return unlockedAbilities;
    }

    isAbilityRequirementsMet(abilityIndex) {
        return Book.isAbilityRequirementsMet(this.datastoreObject, abilityIndex);
    }

    static isAbilityRequirementsMet(datastoreObject, abilityIndex) {
        if(abilityIndex >= datastoreObject.abilities.length || abilityIndex < 0) {
            return false;
        }

        const requirements = datastoreObject.abilities[abilityIndex].requirements;
        if(!requirements) {
            return true;
        }

        let isMet = true;
        for (const requirement of requirements) {
            if (!BookRequirement.isMet(requirement)) {
                isMet = false;
            }
        }

        return isMet;
    }

    /**
     * @override
     * @returns {BookData}
     */
    getData() {
        return /**@type {BookData}*/(this.datastoreObject);
    }
}

module.exports = {BookRequirement, Book};