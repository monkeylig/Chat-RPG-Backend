const { BattlePlayer } = require("../battle-agent");
const { BookRequirement, Book } = require("../book");

test('Is Book Requirement met', () => {
    const requirement = new BookRequirement({
        description: 'Slay 10 monsters with a sword style weapon.',
        requiredCount: 10,
        count: 0,
        tracker: {
            type: 'weaponStyleVictory',
            value: 'sword'
        }
    });

    expect(requirement.isMet()).toBeFalsy();
    
    requirement.getData().count = requirement.getData().requiredCount;

    expect(requirement.isMet()).toBeTruthy();
});

describe.each([
    ['sword'],
    ['staff']
])('Update Book Requirement: %s Style Victory', (style) => {
    test('Basic Case', () => {
        const requirement = new BookRequirement({
            description: `Slay 10 monsters with a ${style} style weapon.`,
            requiredCount: 10,
            count: 0,
            tracker: {
                type: 'weaponStyleVictory',
                value: style
            }
        });

        const owner1 = new BattlePlayer({
            id: `${style} player`,
            weapon: {
                style: style
            }
        });

        const owner2 = new BattlePlayer({
            id: 'player2',
            weapon: {
                style: 'randoStyle'
            }
        });

        const winningBattleUpdate = {
            monster: {
                level: 5
            },
            result: {
                winner: `${style} player`
            }
        };

        const losingBattleUpdate = {
            monster: {
                level: 5
            },
            result: {
                winner: `monster`
            }
        };

        let currentCount = requirement.getData().count;

        expect(requirement.updateAbilityRequirement(owner1, winningBattleUpdate)).toBeFalsy();
        expect(requirement.getData().count).toBe(currentCount + 1);

        currentCount = requirement.getData().count;

        expect(requirement.updateAbilityRequirement(owner2, winningBattleUpdate)).toBeFalsy();
        expect(requirement.getData().count).toBe(currentCount);

        expect(requirement.updateAbilityRequirement(owner1, losingBattleUpdate)).toBeFalsy();
        expect(requirement.getData().count).toBe(currentCount);

        for (let i=0; requirement.getData().count < requirement.getData().requiredCount - 1; i++) {
            requirement.updateAbilityRequirement(owner1, winningBattleUpdate)
        }

        expect(requirement.updateAbilityRequirement(owner1, winningBattleUpdate)).toBeTruthy();
        expect(requirement.getData().count).toBe(requirement.getData().requiredCount);
    });

    test('Level Requirement', () =>{
        const requirement = new BookRequirement({
            description: `Slay 10 level 5 monsters with a ${style} style weapon.`,
            requiredCount: 10,
            count: 0,
            tracker: {
                type: 'weaponStyleVictory',
                value: style,
                level: 5
            }
        });

        const owner = new BattlePlayer({
            id: `${style} player`,
            weapon: {
                style: style
            }
        });

        const battleUpdate = {
            monster: {
                level: 5
            },
            result: {
                winner: `${style} player`
            }
        };

        const lowLevelBattleUpdate = {
            monster: {
                level: 1
            },
            result: {
                winner: `monster`
            }
        };

        const overLevelBattleUpdate = {
            monster: {
                level: 10
            },
            result: {
                winner: `${style} player`
            }
        };

        let currentCount = requirement.getData().count;

        expect(requirement.updateAbilityRequirement(owner, battleUpdate)).toBeFalsy();
        expect(requirement.getData().count).toBe(currentCount + 1);

        currentCount = requirement.getData().count;

        expect(requirement.updateAbilityRequirement(owner, lowLevelBattleUpdate)).toBeFalsy();
        expect(requirement.getData().count).toBe(currentCount);

        expect(requirement.updateAbilityRequirement(owner, overLevelBattleUpdate)).toBeFalsy();
        expect(requirement.getData().count).toBe(currentCount + 1);
    });
});

test('Update Ability Requirements', () => {
    const testBook = new Book({
        name: 'test book',
        icon: 'tome_azure.webp',
        abilities: [
            {
                requirements: [
                    {
                        description: 'Slay 2 monsters with a sword style weapon.',
                        requiredCount: 2,
                        count: 0,
                        tracker: {
                            type: 'weaponStyleVictory',
                            value: 'sword'
                        }
                    },
                    {
                        description: 'Slay 2 monsters with a staff style weapon.',
                        requiredCount: 2,
                        count: 0,
                        tracker: {
                            type: 'weaponStyleVictory',
                            value: 'staff'
                        }
                    }
        
                ],
                ability: {
                    name: 'ability 1'
                }
            },
            {
                requirements: [
                    {
                        description: 'Slay 2 monsters with a sword style weapon.',
                        requiredCount: 3,
                        count: 0,
                        tracker: {
                            type: 'weaponStyleVictory',
                            value: 'sword'
                        }
                    },
                    {
                        description: 'Slay 2 monsters with a staff style weapon.',
                        requiredCount: 3,
                        count: 0,
                        tracker: {
                            type: 'weaponStyleVictory',
                            value: 'staff'
                        }
                    }
        
                ],
                ability: {
                    name: 'ability 2'
                }
            }
        ]
    });

    const owner = new BattlePlayer({
        id: `player`,
        weapon: {
            style: 'sword'
        }
    });

    const battleUpdate = {
        monster: {
            level: 5
        },
        result: {
            winner: `player`
        }
    };

    let unlockedAbilities = testBook.updateAbilityRequirements(owner, battleUpdate);

    expect(unlockedAbilities).toBeDefined();
    expect(unlockedAbilities.length).toBe(0);

    unlockedAbilities = testBook.updateAbilityRequirements(owner, battleUpdate);

    expect(unlockedAbilities).toBeDefined();
    expect(unlockedAbilities.length).toBe(0);

    owner.getData().weapon.style = 'staff';

    unlockedAbilities = testBook.updateAbilityRequirements(owner, battleUpdate);

    expect(unlockedAbilities).toBeDefined();
    expect(unlockedAbilities.length).toBe(0);

    unlockedAbilities = testBook.updateAbilityRequirements(owner, battleUpdate);

    expect(unlockedAbilities).toBeDefined();
    expect(unlockedAbilities.length).toBe(1);
    expect(unlockedAbilities[0].ability.name).toBe('ability 1');

    unlockedAbilities = testBook.updateAbilityRequirements(owner, battleUpdate);

    expect(unlockedAbilities).toBeDefined();
    expect(unlockedAbilities.length).toBe(0);

    owner.getData().weapon.style = 'sword';

    unlockedAbilities = testBook.updateAbilityRequirements(owner, battleUpdate);

    expect(unlockedAbilities).toBeDefined();
    expect(unlockedAbilities.length).toBe(1);
    expect(unlockedAbilities[0].ability.name).toBe('ability 2');

});

test('Is Ability Requirements Met', () => {
    const testBook = new Book({
        name: 'test book',
        icon: 'tome_azure.webp',
        abilities: [
            {
                requirements: [
                    {
                        description: 'Slay 2 monsters with a sword style weapon.',
                        requiredCount: 2,
                        count: 0,
                        tracker: {
                            type: 'weaponStyleVictory',
                            value: 'sword'
                        }
                    },
                    {
                        description: 'Slay 2 monsters with a staff style weapon.',
                        requiredCount: 2,
                        count: 0,
                        tracker: {
                            type: 'weaponStyleVictory',
                            value: 'staff'
                        }
                    }
        
                ],
                ability: {
                    name: 'ability 1'
                }
            }
        ]
    });

    expect(testBook.isAbilityRequirementsMet(0)).toBeFalsy();

    testBook.getData().abilities[0].requirements[0].count = 2;

    expect(testBook.isAbilityRequirementsMet(0)).toBeFalsy();

    testBook.getData().abilities[0].requirements[1].count = 2;

    expect(testBook.isAbilityRequirementsMet(0)).toBeTruthy();

    expect(testBook.isAbilityRequirementsMet(1)).toBeFalsy();
    expect(testBook.isAbilityRequirementsMet(-1)).toBeFalsy();

});