const Ability = require('../datastore-objects/ability');
const animations = require('./animations');

const warriorMasteryI = {
    name: 'Warrior Mastery I',
    icon: 'tome_azure.webp',
    description: 'A book of sword techniques that every warrior should know.',
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
                speed: 4,
                baseDamage: 30,
                weaponSpeedAmp: 2,
                description: "Increases weapon speed.",
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
                name: 'Amp Up',
                type: 'physical',
                style: 'sword',
                speed: 3,
                strengthAmp: 2,
                description: "Increases user's strength.",
                animation: animations.swordBuff1
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
                name: 'Focus',
                type: 'physical',
                style: 'sword',
                speed: 3,
                empowerment: {
                    physical: 60
                },
                description: "The user gains physical empowerment.",
                animation: animations.swordBuff1
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
                name: 'Brutalize',
                type: 'physical',
                style: 'sword',
                baseDamage: 80,
                speed: 4,
                description: "A flurry of powerful slashes doing great damage.",
                animation: animations.blueSlash2
            }).getData()
        }
    ]
};

const wizardMasteryI = {
    name: 'Wizard Mastery I',
    icon: 'tome_azure.webp',
    description: 'A book of spells that every wizard should learn.',
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
                name: 'Drag Shot',
                type: 'magical',
                style: 'staff',
                baseDamage: 30,
                speed: 3,
                targetWeaponSpeedAmp: -2,
                description: "Reduces target's weapon speed.",
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
                description: "Increases user's magic.",
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
                speed: 3,
                empowerment: {
                    magical: 60
                },
                description: "The user gains magical empowerment.",
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
                description: "A great blast of magic.",
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