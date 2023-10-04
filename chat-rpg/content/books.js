const Ability = require('../datastore-objects/ability');
const animations = require('./animations');

const warriorMasteryI = {
    name: 'Warrior Mastery I',
    icon: 'tome_azure.webp',
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
            weaponKillRequirements: {
                sword: 20
            },
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
            weaponKillRequirements: {
                sword: 30
            },
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
            weaponKillRequirements: {
                sword: 40
            },
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
    abilities: [
        {
            weaponKillRequirements: {
                staff: 10
            },
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
            weaponKillRequirements: {
                staff: 20
            },
            ability: new Ability({
                name: 'Arcania',
                type: 'magical',
                style: 'staff',
                speed: 4,
                magicAmp: 2,
                description: "Increases user's magic.",
                animation: animations.impact2
            }).getData()
        },
        {
            weaponKillRequirements: {
                staff: 30
            },
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
            weaponKillRequirements: {
                staff: 40
            },
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