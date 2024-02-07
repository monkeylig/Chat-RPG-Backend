const Ability = require('../datastore-objects/ability');
const animations = require('./animations');

const warriorMasteryI = {
    name: 'Warrior Mastery',
    icon: 'warrior_mastery_1.webp',
    description: 'Every new warrior must begin somewhere. This book will introduce you to the play style of the warrior class. Pick up a sword and start unlocking these sleights!',
    abilities: [
        {
            requirements: [
                {
                    description: 'Slay 10 monsters with a sword style weapon.',
                    requiredCount: 10,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'sword'
                    }
                }
            ],
            ability: new Ability({
                name: 'Blitz',
                type: 'physical',
                style: 'sword',
                speed: 5,
                baseDamage: 50,
                weaponSpeedAmp: 2,
                apCost: 1,
                description: "Increases the user's weapon speed.",
                animation: animations.orangeStab1
            }).getData()
        },
        {
            requirements: [
                {
                    description: 'Slay 20 monsters with a sword style weapon.',
                    requiredCount: 20,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'sword'
                    }
                }
            ],
            ability: new Ability({
                name: 'Fury Assault',
                type: 'physical',
                style: 'sword',
                baseDamage: 40,
                speed: 3,
                addAbilityStrikes: [
                    {
                        durationCondition: {
                            type: 'strikes',
                            value: 2
                        },
                        ability: new Ability({
                            type: 'physical',
                            style: 'sword',
                            strengthAmp: 1,
                            target: 'self',
                            animation: animations.swordBuff1,
                        }).getData()
                    }
                ],
                apCost: 1,
                description: "The next 2 strikes will slightly increase the user's strength.",
                animation: animations.blueFlurry
            }).getData()
        },
        {
            requirements: [
                {
                    description: 'Slay 30 monsters with a sword style weapon.',
                    requiredCount: 30,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'sword'
                    }
                }
            ],
            ability: new Ability({
                name: 'Guard Attack',
                type: 'physical',
                style: 'sword',
                baseDamage: 40,
                protection: {
                    physical: 10
                },
                speed: 3,
                addAbilityStrikes: [
                    {
                        durationCondition: {
                            type: 'strikes',
                            value: 2
                        },
                        ability: new Ability({
                            type: 'physical',
                            style: 'sword',
                            protection: {
                                physical: 10
                            },
                            target: 'self',
                            animation: animations.swordBuff1,
                        }).getData()
                    }
                ],
                apCost: 1,
                description: "Gain 10 physical protection. The next 2 strikes will give the user 10 physical protection.",
                animation: animations.blueSlash3
            }).getData()
        },
        {
            requirements: [
                {
                    description: 'Slay 40 monsters with a sword style weapon.',
                    requiredCount: 40,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'sword'
                    }
                }
            ],
            ability: new Ability({
                name: 'Parry',
                type: 'physical',
                style: 'staff',
                setCounterAbility: {
                    type: 'strike',
                    ability: {
                        name: 'Parry',
                        baseDamage: 30,
                        animation: animations.blueSlash3
                    }
                },
                target: 'self',
                apCost: 1,
                animation: animations.swordBuff1,
                description: 'If the target attacks with a strike, then it does nothing and the user attacks the target instead.',
            }).getData()
        },
        {
            requirements: [
                {
                    description: 'Slay 50 monsters with a sword style weapon.',
                    requiredCount: 50,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'sword'
                    }
                }
            ],
            ability: new Ability({
                name: 'Mega Slash',
                type: 'physical',
                style: 'sword',
                baseDamage: 90,
                speed: 3,
                apCost: 2,
                description: "A might feat of strength doing great damage.",
                animation: animations.blueSlash2
            }).getData()
        }
    ]
};

const wizardMasteryI = {
    name: 'Wizard Mastery',
    icon: 'wizard_mastery_1.webp',
    description: 'Every new wizard must begin somewhere. This book will introduce you to the play style of the wizard class. Pick up a staff and start unlocking these spells!',
    abilities: [
        {
            requirements: [
                {
                    description: 'Slay 10 monsters with a staff style weapon.',
                    requiredCount: 10,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'staff'
                    }
                }
            ],
            ability: new Ability({
                name: 'Smite',
                type: 'magical',
                style: 'staff',
                baseDamage: 60,
                speed: 3,
                apCost: 1,
                description: "A bolt of energy dealing magical damage.",
                animation: animations.impact2
            }).getData()
        },
        {
            requirements: [
                {
                    description: 'Slay 20 monsters with a staff style weapon.',
                    requiredCount: 20,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'staff'
                    }
                }
            ],
            ability: new Ability({
                name: 'Arcania',
                type: 'magical',
                style: 'staff',
                speed: 4,
                magicAmp: 2,
                addAbilities: [
                    {
                        name: 'Arcane Burst',
                        type: 'magical',
                        style: 'staff',
                        charges: 1,
                        baseDamage: 40,
                        apCost: 1,
                        speed: 3,
                        description: 'The user summons a surplus of magical energy and releases it in a small burst.',
                        animation: animations.impact7
                    }
                ],
                target: 'self',
                apCost: 1,
                description: "Increases user's magic. Increases the user's magic. Gain the ability Arcane Burst",
                animation: animations.magicBuff1
            }).getData()
        },
        {
            requirements: [
                {
                    description: 'Slay 30 monsters with a staff style weapon.',
                    requiredCount: 30,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'staff'
                    }
                }
            ],
            ability: new Ability({
                name: 'Protect',
                type: 'magical',
                style: 'staff',
                speed: 3,
                protection: {
                    magical: 20
                },
                addAbilities: [
                    {
                        name: 'Repel',
                        type: 'magical',
                        style: 'staff',
                        charges: 1,
                        setCounterAbility: {
                            type: 'strike',
                            ability: {
                                name: 'Repel',
                                baseDamage: 20,
                                animation: animations.impact7
                            }
                        },
                        target: 'self',
                        animation: animations.magicBuff1,
                        description: 'If the target attacks with a strike, then it does nothing and the user attacks the target instead.',
                    }
                ],
                target: 'self',
                apCost: 1,
                description: "Gain 20% magical protection. Gain the ability Repel.",
                animation: animations.magicBuff1
            }).getData()
        },
        {
            requirements: [
                {
                    description: 'Slay 30 monsters with a staff style weapon.',
                    requiredCount: 30,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'staff'
                    }
                }
            ],
            ability: new Ability({
                name: 'Magnus',
                type: 'magical',
                style: 'staff',
                speed: 4,
                empowerment: {
                    magical: 60
                },
                apCost: 1,
                target: 'self',
                description: "Gain 60 magical empowerment. This means your next magical attack's base damage will be increased by 60.",
                animation: animations.magicBuff1
            }).getData()
        },
        {
            requirements: [
                {
                    description: 'Slay 40 monsters with a staff style weapon.',
                    requiredCount: 40,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'staff'
                    }
                }
            ],
            ability: new Ability({
                name: 'Magic Blast',
                type: 'magical',
                style: 'staff',
                baseDamage: 90,
                speed: 2,
                apCost: 2,
                description: "A great blast of magical damage. Effective against opponents with physical protection.",
                animation: animations.blast1
            }).getData()
        },
    ]
};

const books = {
    warriorMasteryI,
    wizardMasteryI
};

module.exports = books;