const DatastoreObject = require('./datastore-object');

class BookRequirement extends DatastoreObject {
    constructor(objectData) {
        super(objectData);
    }

    constructNewObject(requirement) {
        requirement.description = 'Fullfill this requirement to unlock this ability.';
        requirement.requiredCount = 0;
        requirement.count = 0;
        requirement.tracker = {type: '', value: ''};
    }

    static #incrementRequirement(datastoreObject) {
        datastoreObject.count = Math.min(datastoreObject.count + 1, datastoreObject.requiredCount);
    }

    updateAbilityRequirement(owner, battleUpdate) {
        return BookRequirement.updateAbilityRequirement(this.datastoreObject, owner, battleUpdate);
    }

    //returns true if the ability has just become unlocked
    static updateAbilityRequirement(datastoreObject, owner, battleUpdate) {
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
}

class Book extends DatastoreObject {
    constructor(objectData) {
        super(objectData);
    }

    constructNewObject(book) {
        book.name = '';
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
}

module.exports = {BookRequirement, Book};