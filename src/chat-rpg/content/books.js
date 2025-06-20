/**
 * @import {AbilityStrikeEffectData} from '../battle-system/effects/ability-strike-effect'
 * @import {CounterEffectData} from '../battle-system/effects/counter-effect'
 */

const { TargetEnum, PlayerActionType, PlayerActionStyle, ElementsEnum } = require('../battle-system/action');
const animations = require('./animations');

const warriorMasteryI = {
    name: 'Warrior Mastery',
    icon: 'warrior_mastery_1.webp',
    description: 'Every new warrior must begin somewhere. This book will introduce you to the play style of the warrior class. Pick up a sword and start unlocking these abilities!',
    abilities: [
        {
            requirements: [
                {
                    description: 'Begin your Legion Slayer journey.',
                    requiredCount: 0,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'sword'
                    }
                }
            ],
            ability: {
                name: 'Blitz',
                type: 'physical',
                style: 'sword',
                target: 'opponent',
                speed: 4,
                baseDamage: 30,
                apCost: 1,
                description: "A very fast attack dealing modest damage. Slightly increase your weapon speed. Follow up your next 2 strikes with a 10 base damage attack.",
                animation: animations.orangeStab1,
                postActions: [
                    {
                        type: PlayerActionType.Physical,
                        style: PlayerActionStyle.Sword,
                        target: TargetEnum.Self,
                        weaponSpeedAmp: 1
                    },
                    {
                        type: PlayerActionType.Physical,
                        style: PlayerActionStyle.Sword,
                        target: 'self',
                        addEffect: {
                            class: 'AbilityStrikeEffect',
                            /**@type {AbilityStrikeEffectData} */
                            inputData: {
                                strikeDuration: 2,
                                ability: {
                                    animation: animations.blueStab1,
                                    type: PlayerActionType.Physical,
                                    style: PlayerActionStyle.Sword,
                                    target: TargetEnum.Opponent,
                                    baseDamage: 10,
                                }
                            }
                        }
                    }
                ]
            }
        },
        {
            requirements: [
                {
                    description: 'Slay 10 monsters with a sword-style weapon.',
                    requiredCount: 10,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'sword'
                    }
                }
            ],
            ability: {
                name: 'Fury Assault',
                type: 'physical',
                style: 'sword',
                target: 'opponent',
                baseDamage: 30,
                speed: 3,
                apCost: 1,
                description: "Follow up your next 2 strikes with a 15 base damage attack.",
                animation: animations.blueFlurry,
                postActions: [
                    {
                        target: 'self',
                        addEffect: {
                            class: 'AbilityStrikeEffect',
                            /**@type {AbilityStrikeEffectData} */
                            inputData: {
                                strikeDuration: 2,
                                ability: {
                                    target: TargetEnum.Opponent,
                                    type: PlayerActionType.Physical,
                                    style: PlayerActionStyle.Sword,
                                    baseDamage: 15,
                                    animation: animations.blueStab1,
                                }
                            }
                        }
                    }
                ]
            }
        },
        {
            requirements: [
                {
                    description: 'Slay 20 monsters with a sword-style weapon.',
                    requiredCount: 20,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'sword'
                    }
                }
            ],
            ability: {
                name: 'Sentinel',
                description: "Gain 12% physical protection and 30 physical empowerment.",
                animation: animations.swordBuff1,
                type: 'physical',
                style: 'sword',
                target: TargetEnum.Self,
                speed: 3,
                apCost: 1,
                protection: {
                    physical: 12
                },
                empowerment: {
                    physical: 30
                }
            }
        },
        {
            requirements: [
                {
                    description: 'Slay 30 monsters with a sword-style weapon.',
                    requiredCount: 30,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'sword'
                    }
                }
            ],
            ability: {
                name: 'Parry',
                description: "Slightly increase your strength. Counter the target's strike with a 40 base damage attack.",
                animation: animations.swordBuff1,
                type: 'physical',
                style: 'staff',
                target: 'self',
                speed: 0,
                priority: 10,
                apCost: 1,
                strengthAmp: 1,
                addEffect: {
                    class: 'CounterEffect',
                    inputData: {
                        filter: {
                            attackType: 'strike'
                        },
                        ability: {
                            name: 'Parry',
                            target: 'opponent',
                            type: 'physical',
                            style: 'sword',
                            baseDamage: 40,
                            animation: animations.impact7
                        }
                    }
                }
            }
        },
        {
            requirements: [
                {
                    description: 'Slay 40 monsters with a sword-style weapon.',
                    requiredCount: 40,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'sword'
                    }
                }
            ],
            ability: {
                name: 'Mega Slash',
                type: 'physical',
                style: 'sword',
                target: 'opponent',
                baseDamage: 75,
                speed: 3,
                apCost: 2,
                description: "Slash the target with devastating force.",
                animation: animations.purpleImpact
            }
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
                    description: 'Begin your Legion Slayer journey.',
                    requiredCount: 0,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'staff'
                    }
                }
            ],
            ability: {
                name: 'Smite',
                description: "A bolt of energy dealing magical damage.",
                animation: animations.impact2,
                type: 'magical',
                style: 'staff',
                target: 'opponent',
                baseDamage: 50,
                speed: 3,
                apCost: 1,
            }
        },
        {
            requirements: [
                {
                    description: 'Slay 10 monsters with a staff-style weapon.',
                    requiredCount: 10,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'staff'
                    }
                }
            ],
            ability: {
                name: 'Arcania',
                type: 'magical',
                style: 'staff',
                target: 'self',
                speed: 3,
                magicAmp: 1,
                apCost: 1,
                description: "Slightly increase your magic. Gain the ability Arcane Burst.",
                animation: animations.magicBuff1,
                addAbility: {
                    name: 'Arcane Burst',
                    type: 'magical',
                    style: 'staff',
                    target: 'opponent',
                    charges: 1,
                    baseDamage: 35,
                    speed: 3,
                    description: 'Summon a surplus of magical energy and releases it in one burst.',
                    animation: animations.impact7
                }
            }
        },
        {
            requirements: [
                {
                    description: 'Slay 20 monsters with a staff-style weapon.',
                    requiredCount: 20,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'staff'
                    }
                }
            ],
            ability: {
                name: 'Protect',
                description: "Gain 10% magical protection. Gain the ability Repel.",
                animation: animations.magicBuff1,
                type: 'magical',
                style: 'staff',
                target: 'self',
                speed: 3,
                protection: {
                    magical: 10
                },
                apCost: 1,
                addAbility: {
                    name: 'Repel',
                    description: "Counter the target's strike with a 40 base damage attack.",
                    animation: animations.magicBuff1,
                    type: 'magical',
                    style: 'staff',
                    target: 'self',
                    priority: 10,
                    speed: 0,
                    charges: 1,
                    addEffect: {
                        class: 'CounterEffect',
                        inputData: {
                            filter: {
                                attackType: 'strike'
                            },
                            ability: {
                                name: 'Repel',
                                target: 'opponent',
                                baseDamage: 40,
                                type: 'magical',
                                style: 'staff',
                                animation: animations.impact7
                            }
                        }
                    }
                }
            }
        },
        {
            requirements: [
                {
                    description: 'Slay 30 monsters with a staff-style weapon.',
                    requiredCount: 30,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'staff'
                    }
                }
            ],
            ability: {
                name: 'Magnus',
                description: "Gain 65 magical empowerment.",
                animation: animations.magicBuff1,
                type: 'magical',
                style: 'staff',
                target: 'self',
                speed: 3,
                empowerment: {
                    magical: 60
                },
                apCost: 1,
            }
        },
        {
            requirements: [
                {
                    description: 'Slay 40 monsters with a staff-style weapon.',
                    requiredCount: 40,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'staff'
                    }
                }
            ],
            ability: {
                name: 'Magic Blast',
                type: 'magical',
                style: 'staff',
                target: 'opponent',
                baseDamage: 80,
                speed: 2,
                apCost: 2,
                description: "A great blast of magical damage. Effective against opponents with physical protection.",
                animation: animations.blast1
            }
        },
    ]
};

const fireMagic = {
    name: 'Fire Magic',
    icon: 'fire_magic_book.webp',
    description: 'The flames of magic burn bright. These spells will give command over the fiercest of flames.',
    abilities: [
        {
            requirements: [
                {
                    description: 'Slay 10 monsters that are at least level 20 with a staff style weapon.',
                    requiredCount: 10,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'staff',
                        level: 20,
                    }
                }
            ],
            ability: {
                name: 'Fire Bolt',
                type: 'magical',
                style: 'staff',
                target: 'opponent',
                elements: ['fire'],
                speed: 3,
                baseDamage: 50,
                apCost: 1,
                description: "A bolt of condensed fire that explodes on contact.",
                animation: animations.explosion
            }
        },
        { 
            requirements: [
                {
                    description: 'Slay 20 monsters that are at least level 20 with a staff style weapon.',
                    requiredCount: 20,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'staff',
                        level: 20,
                    }
                }
            ],
            ability: {
                name: 'Flame Cloak',
                type: 'magical',
                style: 'staff',
                target: 'self',
                elements: ['fire'],
                fireResistAmp: 4,
                speed: 1,
                apCost: 1,
                description: "Significantly increase your fire resistance. Gain the ability Flame Burst.",
                animation: animations.fireBuff,
                addAbility: {
                    name: 'Flame Burst',
                    type: 'magical',
                    style: 'staff',
                    target: 'opponent',
                    elements: ['fire'],
                    charges: 1,
                    baseDamage: 65,
                    fireResistAmp: -4,
                    apCost: 1,
                    speed: 4,
                    description: "Significantly reduce your fire resistance.",
                    animation: animations.fireWave
                }
            }
        },
        {
            requirements: [
                {
                    description: 'Slay 30 monsters that are at least level 20 with a staff style weapon.',
                    requiredCount: 30,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'staff',
                        level: 20,
                    }
                }
            ],
            ability: {
                name: 'Flame Cloud',
                type: 'magical',
                style: 'staff',
                target: 'opponent',
                baseDamage: 25,
                elements: ['fire'],
                fireResistAmp: -1,
                speed: 3,
                apCost: 1,
                description: "Slightly reduce the target's fire resistance. Gain the ability Molten Rain.",
                animation: animations.fireBurst,
                postActions: [
                    {
                        target: 'self',
                        addAbility: {
                            name: 'Molten Rain',
                            type: 'magical',
                            style: 'staff',
                            target: 'opponent',
                            elements: ['fire'],
                            charges: 1,
                            baseDamage: 10,
                            apCost: 1,
                            speed: 2,
                            description: 'Hits 1 to 6 times.',
                            animation: animations.fireRain,
                            customActions: [
                                {
                                    name: 'MultiHitAttack',
                                    data: {
                                        minHits: 1,
                                        maxHits: 6
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            requirements: [
                {
                    description: 'Slay 40 monsters that are at least level 20 with a staff style weapon.',
                    requiredCount: 40,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'staff',
                        level: 20,
                    }
                }
            ],
            ability: {
                name: 'Pyromancy',
                description: "Imbue your weapon with fire for 1 round. Gain the abilities Pyro Missile and Pyro Shield.",
                animation: animations.fireBuff,
                type: 'magical',
                style: 'staff',
                target: 'self',
                elements: ['fire'],
                apCost: 1,
                speed: 3,
                addEffect: {
                    class: 'ImbueEffect',
                    inputData: {
                        element: 'fire',
                        roundsLeft: 1
                    }
                },
                addAbility: {
                    name: 'Pyro Missile',
                    description: 'If your weapon is imbued with fire, this attack hits a second time.',
                    animation: animations.pyroMissile,
                    target: 'opponent',
                    type: PlayerActionType.Magical,
                    style: PlayerActionStyle.Staff,
                    elements: [ElementsEnum.Fire],
                    speed: 3,
                    charges: 1,
                    baseDamage: 30,
                    customActions: [
                        {
                            name: 'EffectBoost',
                            data: {
                                effectClass: 'ImbueEffect',
                                imbueElements: ['fire'],
                                target: 'self',
                                extraActions: [
                                    {
                                        target: 'opponent',
                                        type: PlayerActionType.Magical,
                                        style: PlayerActionStyle.Staff,
                                        elements: [ElementsEnum.Fire],
                                        baseDamage: 30,
                                    }
                                ]
                            }
                        }
                    ],
                },
                postActions: [
                    {
                        target: 'self',
                        addAbility: {
                            name: 'Pyro Shield',
                            description: 'Gain 14% magical protection. If your weapon is imbued with fire, gain 14% more magical protection.',
                            animation: animations.pyroShield,
                            target: 'self',
                            type: PlayerActionType.Magical,
                            style: PlayerActionStyle.Staff,
                            elements: [ElementsEnum.Fire],
                            speed: 3,
                            charges: 1,
                            protection: {
                                magical: 14
                            },
                            customActions: [
                                {
                                    name: 'EffectBoost',
                                    data: {
                                        effectClass: 'ImbueEffect',
                                        imbueElements: ['fire'],
                                        target: 'self',
                                        protectionIncrease: {
                                            magical: 14
                                        }
                                    }
                                }
                            ],
                        },
                    }
                ]
            }
        },
        {
            requirements: [
                {
                    description: 'Slay 50 monsters that are at least level 20 with a staff style weapon.',
                    requiredCount: 50,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'sword',
                        level: 20,
                    }
                }
            ],
            ability: {
                name: 'Incinerate',
                type: 'magical',
                style: 'staff',
                target: 'opponent',
                baseDamage: 55,
                baseDamageTextModifier: '+',
                elements: ['fire'],
                customActions: [
                    {
                        name: 'EffectBoost',
                        data: {
                            damageIncrease: 35,
                            effectClass: "AblazedEffect"
                        }
                    }
                ],
                speed: 3,
                apCost: 2,
                description: "If the target is ablazed, the base damage is increased by 35.",
                animation: animations.fireColumn
            }
        }
    ]
};

const waterMagic = {
    name: 'Water Magic',
    icon: 'water_magic_book.webp',
    description: 'Water flows and takes many shapes. These spells grant the user power over the many forms of water.',
    abilities: [
        {
            requirements: [
                {
                    description: 'Slay 10 monsters that are at least level 20 with a staff style weapon.',
                    requiredCount: 10,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'staff',
                        level: 20,
                    }
                }
            ],
            ability: {
                name: 'Water Bullet',
                type: 'magical',
                style: 'staff',
                target: 'opponent',
                elements: ['water'],
                speed: 4,
                baseDamage: 45,
                apCost: 1,
                description: "Water takes the shape if a bullet that is fired with great speed at it's target.",
                animation: animations.waterSplash2
            }
        },
        {
            requirements: [
                {
                    description: 'Slay 20 monsters that are at least level 20 with a staff style weapon.',
                    requiredCount: 20,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'staff',
                        level: 20,
                    }
                }
            ],
            ability: {
                name: 'Aqua Brace',
                type: 'magical',
                style: 'staff',
                target: 'self',
                elements: ['water'],
                waterResistAmp: 4,
                speed: 1,
                apCost: 1,
                description: "Significantly increase your water resistance. Gain the ability Aqua Burst.",
                animation: animations.waterBuff,
                addAbility: {
                    name: 'Aqua Burst',
                    type: 'magical',
                    style: 'staff',
                    target: 'opponent',
                    elements: ['water'],
                    charges: 1,
                    baseDamage: 65,
                    waterResistAmp: -4,
                    apCost: 1,
                    speed: 4,
                    description: "Significantly reduce the target's water resistance.",
                    animation: animations.waterSplash3
                }
            }
        },
        {
            requirements: [
                {
                    description: 'Slay 20 monsters that are at least level 20 with a staff style weapon.',
                    requiredCount: 20,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'staff',
                        level: 20,
                    }
                }
            ],
            ability: {
                name: 'Tide Rush',
                type: 'magical',
                style: 'staff',
                target: 'opponent',
                elements: ['water'],
                speed: 3,
                baseDamage: 10,
                waterResistAmp: -1,
                apCost: 1,
                description: "Slightly reduce the target's water resistance. Gain the ability Wave Crash.",
                animation: animations.waterPop,
                postActions: [
                    {
                        target: 'self',
                        addAbility: {
                            name: 'Wave Crash',
                            type: 'magical',
                            style: 'staff',
                            target: 'opponent',
                            elements: ['water'],
                            charges: 1,
                            baseDamage: 55,
                            speed: 3,
                            description: "Force the water in the surrounding area to collapse onto the target.",
                            animation: animations.wave
                        }
                    }
                ]
            }
        },
        {
            requirements: [
                {
                    description: 'Slay 40 monsters that are at least level 20 with a staff style weapon.',
                    requiredCount: 40,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'staff',
                        level: 20,
                    }
                }
            ],
            ability: {
                name: 'Cryomancy',
                description: "Imbue your weapon with ice for 1 round. Gain the abilities Cryo Missile and Cryo Shield.",
                animation: animations.waterBuff,
                target: TargetEnum.Self,
                type: PlayerActionType.Magical,
                style: PlayerActionStyle.Staff,
                elements: [ElementsEnum.Ice],
                speed: 3,
                apCost: 1,
                addEffect: {
                    class: 'ImbueEffect',
                    inputData: {
                        element: 'ice',
                        roundsLeft: 1
                    }
                },
                addAbility: {
                    name: 'Cryo Missile',
                    description: 'If your weapon is imbued with ice, this attack hits a second time.',
                    animation: animations.cryoMissile,
                    target: TargetEnum.Opponent,
                    type: PlayerActionType.Magical,
                    style: PlayerActionStyle.Staff,
                    elements: [ElementsEnum.Ice],
                    speed: 3, 
                    baseDamage: 30,
                    charges: 1,
                    customActions: [
                        {
                            name: 'EffectBoost',
                            data: {
                                effectClass: 'ImbueEffect',
                                imbueElements: ['ice'],
                                target: 'self',
                                extraActions: [
                                    {
                                        target: 'opponent',
                                        type: PlayerActionType.Magical,
                                        style: PlayerActionStyle.Staff,
                                        elements: [ElementsEnum.Ice],
                                        baseDamage: 30,
                                    }
                                ]
                            }
                        }
                    ],
                },
                postActions: [
                    {
                        target: 'self',
                        addAbility: {
                            name: 'Cryo Shield',
                            target: 'self',
                            description: 'Gain 14% magical protection. If your weapon is imbued with ice, gain 14% more magical protection.',
                            animation: animations.cryoShield,
                            type: PlayerActionType.Magical,
                            style: PlayerActionStyle.Staff,
                            elements: [ElementsEnum.Ice],
                            speed: 3,
                            charges: 1,
                            protection: {
                                magical: 14
                            },
                            customActions: [
                                {
                                    name: 'EffectBoost',
                                    data: {
                                        effectClass: 'ImbueEffect',
                                        imbueElements: ['ice'],
                                        target: 'self',
                                        protectionIncrease: {
                                            magical: 14
                                        }
                                    }
                                }
                            ],
                        }
                    }
                ]
            }
        },
        {
            requirements: [
                {
                    description: 'Slay 50 monsters that are at least level 20 with a staff style weapon.',
                    requiredCount: 50,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'staff',
                        level: 20,
                    }
                }
            ],
            ability: {
                name: 'Hydrospout',
                description: "If the target is drenched, this ability's base damage is increased by 10.",
                animation: animations.waterBeam,
                type: 'magical',
                style: 'staff',
                target: 'opponent',
                baseDamage: 70,
                baseDamageTextModifier: '+',
                elements: ['water'],
                customActions: [
                    {
                        name: 'EffectBoost',
                        data: {
                            damageIncrease: 10,
                            effectClass: 'DrenchedEffect'
                        }
                    }
                ],
                speed: 3,
                apCost: 2,
            }
        },
    ]
};

const lightningMagic = {
    name: "Lightning Magic",
    icon: "lightning_magic_book.webp",
    description: 'Lightning surges and flows through the world with raging energy. Use these spells to command the rage of lightning and thunder.',
    abilities: [
        {
            requirements: [
                {
                    description: 'Slay 10 monsters that are at least level 20 with a staff style weapon.',
                    requiredCount: 10,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'staff',
                        level: 20,
                    }
                }
            ],
            ability: {
                name: 'Electrocute',
                type: 'magical',
                style: 'staff',
                target: 'opponent',
                elements: ['lightning'],
                speed: 4,
                baseDamage: 45,
                apCost: 1,
                description: "A lightning bolt rushes to the target and violently rips through them.",
                animation: animations.electric2
            }
        },
        {
            requirements: [
                {
                    description: 'Slay 20 monsters that are at least level 20 with a staff style weapon.',
                    requiredCount: 20,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'staff',
                        level: 20,
                    }
                }
            ],
            ability: {
                name: 'Mega Ohm',
                type: 'magical',
                style: 'staff',
                target: 'self',
                elements: ['lightning'],
                speed: 1,
                lightningResistAmp: 4,
                apCost: 1,
                description: "Significantly increases the user's lightning resistance. The user gains the ability Overload.",
                animation: animations.electricBuff,
                addAbility: {
                    name: 'Overload',
                    description: "Significantly reduce your lightening resistance.",
                    animation: animations.electric,
                    type: 'magical',
                    style: 'staff',
                    target: 'opponent',
                    elements: ['lightning'],
                    charges: 1,
                    baseDamage: 65,
                    lightningResistAmp: -4,
                    speed: 4,
                }
            }
        },
        {
            requirements: [
                {
                    description: 'Slay 30 monsters that are at least level 20 with a staff style weapon.',
                    requiredCount: 30,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'staff',
                        level: 20,
                    }
                }
            ],
            ability: {
                name: 'Magnetize',
                type: 'magical',
                style: 'staff',
                target: 'opponent',
                elements: ['lightning'],
                speed: 3,
                lightningResistAmp: -2,
                apCost: 1,
                description: "Reduces the target's lightning resistance. The user gains the ability Electro Storm.",
                animation: animations.electricCircle,
                postActions: [
                    {
                        target: 'self',
                        addAbility: {
                            name: 'Electro Storm',
                            type: 'magical',
                            style: 'staff',
                            target: 'opponent',
                            elements: ['lightning'],
                            charges: 1,
                            baseDamage: 25,
                            customActions: [
                                {
                                    name: 'MultiHitAttack',
                                    data: {
                                        minHits: 2,
                                        maxHits: 2
                                    }
                                }
                            ],
                            speed: 4,
                            description: "A lightning strike from the sky that hits two times.",
                            animation: animations.electric3
                        }
                    }
                ]
            }
        },
        {
            requirements: [
                {
                    description: 'Slay 40 monsters that are at least level 20 with a staff style weapon.',
                    requiredCount: 40,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'staff',
                        level: 20,
                    }
                }
            ],
            ability: {
                name: 'Electromancy',
                description: "Imbue your weapon with lightning for 1 round. Gain the abilities Electro Missile and Electro Shield.",
                animation: animations.electricBuff,
                target: TargetEnum.Self,
                type: PlayerActionType.Magical,
                style: PlayerActionStyle.Staff,
                elements: [ElementsEnum.Lightning],
                speed: 3,
                apCost: 1,
                addEffect: {
                    class: 'ImbueEffect',
                    inputData: {
                        element: 'lightning',
                        roundsLeft: 1
                    }
                },
                addAbility: {
                    name: 'Electro Missile',
                    description: "If your weapon is imbued with lightning, this attack hits a second time.",
                    animation: animations.electroMissile,
                    target: TargetEnum.Opponent,
                    type: PlayerActionType.Magical,
                    style: PlayerActionStyle.Staff,
                    elements: [ElementsEnum.Lightning],
                    speed: 3,
                    baseDamage: 30,
                    charges: 1,
                    customActions: [
                        {
                            name: 'EffectBoost',
                            data: {
                                effectClass: 'ImbueEffect',
                                imbueElements: ['lightning'],
                                target: 'self',
                                extraActions: [
                                    {
                                        animation: animations.electroMissile,
                                        type: PlayerActionType.Magical,
                                        style: PlayerActionStyle.Staff,
                                        target: TargetEnum.Opponent,
                                        elements: [ElementsEnum.Lightning],
                                        baseDamage: 30
                                    }
                                ]
                            }
                        }
                    ],
                },
                postActions: [
                    {
                        target: 'self',
                        addAbility: {
                            name: 'Electro Shield',
                            description: 'Gain 15% magical protection. If your weapon is imbued with lightning, gain 10% more magical protection.',
                            animation: animations.electroShield,
                            target: TargetEnum.Self,
                            type: PlayerActionType.Magical,
                            style: PlayerActionStyle.Staff,
                            elements: [ElementsEnum.Lightning],
                            speed: 3,
                            charges: 1,
                            protection: {
                                magical: 14
                            },
                            customActions: [
                                {
                                    name: 'EffectBoost',
                                    data: {
                                        effectClass: 'ImbueEffect',
                                        imbueElements: ['lightning'],
                                        target: 'self',
                                        protectionIncrease: {
                                            magical: 14
                                        }
                                    }
                                }
                            ],
                        },
                    }
                ]
            }
        },
        {
            requirements: [
                {
                    description: 'Slay 50 monsters that are at least level 20 with a staff style weapon.',
                    requiredCount: 50,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'staff',
                        level: 20,
                    }
                }
            ],
            ability: {
                name: 'Arc Lightning',
                type: 'magical',
                style: 'staff',
                target: 'opponent',
                elements: ['lightning'],
                baseDamage: 65,
                baseDamageTextModifier: '+',
                customActions: [
                    {
                        name: 'EffectBoost',
                        data: {
                            damageIncrease: 20,
                            effectClass: 'SurgedEffect'
                        }
                    }
                ],
                speed: 4,
                apCost: 2,
                description: "If the target is surged, this ability's base damage is increased by 15.",
                animation: animations.electricColumn
            }
        },
    ]
};

const fireBlade = {
    name: "Fire Blade",
    icon: "fire_blade_book.webp",
    description: 'Fire burns in the heart of a warrior. These techniques will help you unless the fire that burns so brightly in your heart.',
    abilities: [
        {
            requirements: [
                {
                    description: 'Slay 10 monsters that are at least level 20 with a sword style weapon.',
                    requiredCount: 10,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'sword',
                        level: 20,
                    }
                }
            ],
            ability: {
                name: 'Fire Slash',
                type: 'physical',
                style: 'sword',
                target: 'opponent',
                elements: ['fire'],
                speed: 3,
                baseDamage: 50,
                apCost: 1,
                description: "Your blade lights up with fire blooming on it's edge that you use to slash your target with brilliant flames.",
                animation: animations.fireSlash
            }
        },
        {
            requirements: [
                {
                    description: 'Slay 20 monsters that are at least level 20 with a sword style weapon.',
                    requiredCount: 20,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'sword',
                        level: 20,
                    }
                }
            ],
            ability: {
                name: 'Flame Engage',
                type: 'physical',
                style: 'sword',
                target: 'opponent',
                elements: ['fire'],
                speed: 3,
                baseDamage: 40,
                apCost: 1,
                description: "Follow up your next 2 strikes will a 5 base damage attack that slightly decrease the target's fire resistance.",
                animation: animations.fireSlash,
                postActions: [
                    {
                        target: 'self',
                        addEffect: {
                            class: 'AbilityStrikeEffect',
                            inputData: {
                                strikeDuration: 2,
                                ability: {
                                    target: 'opponent',
                                    type: 'physical',
                                    style: 'sword',
                                    animation: animations.fireSlash,
                                    elements: ['fire'],
                                    baseDamage: 5,
                                    fireResistAmp: -1,
                                }
                            }
                        }
                    }
                ]
            }
        },
        {
            requirements: [
                {
                    description: 'Slay 30 monsters that are at least level 20 with a sword style weapon.',
                    requiredCount: 30,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'sword',
                        level: 20,
                    }
                }
            ],
            ability: {
                name: 'Blaze Guard',
                description: "Gain 6% physical protection. Increase your fire resistance. Follow up your next 2 strikes with a 10 base damage attack and gain 6% physical protection.",
                animation: animations.fireBuff,
                type: 'physical',
                style: 'sword',
                target: 'self',
                elements: ['fire'],
                speed: 3,
                fireResistAmp: 2,
                protection: {
                    physical: 6
                },
                addEffect: {
                    class: 'AbilityStrikeEffect',
                    inputData: {
                        strikeDuration: 2,
                        ability: {
                            type: 'physical',
                            style: 'sword',
                            animation: animations.fireSlash,
                            target: TargetEnum.Opponent,
                            elements: ['fire'],
                            baseDamage: 10,
                            postActions: [
                                {
                                    target: TargetEnum.Self,
                                    type: PlayerActionType.Physical,
                                    style: PlayerActionStyle.Sword,
                                    elements: [ElementsEnum.Fire],
                                    protection: {
                                        physical: 6
                                    },
                                }
                            ]
                        }
                    }
                },
                apCost: 1,
            }
        },
        {
            requirements: [
                {
                    description: 'Slay 40 monsters that are at least level 20 with a sword style weapon.',
                    requiredCount: 40,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'sword',
                        level: 20,
                    }
                }
            ],
            ability: {
                name: 'Pyro Knight',
                type: 'physical',
                style: 'sword',
                target: 'self',
                elements: ['fire'],
                speed: 3,
                addEffect: {
                    class: 'ImbueEffect',
                    inputData: {
                        element: 'fire',
                        roundsLeft: 1
                    }
                },
                apCost: 1,
                description: "Your weapon is imbued with fire for 1 turn. All of your fire attacks slightly reduce the target's fire resistance for 2 turns. Follow up your next 2 strikes with a 30 base damage attack, and if your weapon is imbued with fire, the attack hits a second time.",
                animation: animations.fireBuff,
                postActions: [
                    {
                        target: 'self',
                        addEffect: {
                            class: 'AbilityStrikeEffect',
                            inputData: {
                                strikeDuration: 2,
                                ability: {
                                    animation: animations.pyroSlash,
                                    type: 'physical',
                                    style: 'sword',
                                    target: 'opponent',
                                    elements: ['fire'],
                                    baseDamage: 30,
                                    customActions: [
                                        {
                                            name: 'EffectBoost',
                                            data: {
                                                effectClass: 'ImbueEffect',
                                                imbueElements: ['fire'],
                                                target: 'self',
                                                extraActions: [
                                                    {
                                                        type: 'physical',
                                                        style: 'sword',
                                                        target: 'opponent',
                                                        animation: animations.pyroSlash,
                                                        elements: ['fire'],
                                                        baseDamage: 30,
                                                    }
                                                ]
                                            }
                                        }
                                    ],
                                }
                            }
                        },
                    },
                    {
                        target: 'self',
                        addEffect: {
                            class: 'ActionTriggerEffect',
                            inputData: {
                                filter: {
                                    user: 'send',
                                    playerAction: {
                                        isAttack: true,
                                        elements: ['fire']
                                    }
                                },
                                ability: {
                                    target: 'opponent',
                                    type: 'physical',
                                    style: 'sword',
                                    elements: ['fire'],
                                    fireResistAmp: -1
                                },
                                roundsLeft: 2
                            }
                        }
                    }
                ]
            }
        },
        {
            requirements: [
                {
                    description: 'Slay 50 monsters that are at least level 20 with a sword style weapon.',
                    requiredCount: 50,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'sword',
                        level: 20,
                    }
                }
            ],
            ability: {
                name: 'Ignition Incinerator',
                type: 'physical',
                style: 'sword',
                target: 'opponent',
                elements: ['fire'],
                speed: 3,
                baseDamage: 65,
                addEffect: {
                    class: 'AblazedEffect'
                },
                apCost: 2,
                description: "An epic slash that engulfs the target in flames on impact. The target is ablazed",
                animation: animations.fireSlash2
            }
        }
    ]
};

const waterBlade = { 
    name: "Water Blade",
    icon: "water_blade_book.webp",
    description: "Water's rushing tide crashes and breaks the toughest walls. These sword techniques will allow you to harness the slashing power water's infinite forms.",
    abilities: [
        {
            requirements: [
                {
                    description: 'Slay 10 monsters that are at least level 20 with a sword style weapon.',
                    requiredCount: 10,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'sword',
                        level: 20,
                    }
                }
            ],
            ability: {
                name: 'Water Slash',
                type: 'physical',
                style: 'sword',
                target: 'opponent',
                elements: ['water'],
                speed: 3,
                baseDamage: 50,
                apCost: 1,
                description: "Water rushes down your weapon coating it on all side as you slash your opponent with the force of a oceanic wave.",
                animation: animations.waterSplash
            }
        },
        {
            requirements: [
                {
                    description: 'Slay 20 monsters that are at least level 20 with a sword style weapon.',
                    requiredCount: 20,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'sword',
                        level: 20,
                    }
                }
            ],
            ability: {
                name: 'Slashing Tide',
                type: 'physical',
                style: 'sword',
                target: 'opponent',
                elements: ['water'],
                baseDamage: 40,
                speed: 3,
                apCost: 1,
                description: "Follow up your next 2 strikes will a 5 base damage attack that slightly decrease the target's water resistance.",
                animation: animations.waterSlash,
                postActions: [
                    {
                        target: 'self',
                        addEffect: {
                            class: 'AbilityStrikeEffect',
                            inputData: {
                                strikeDuration: 2,
                                ability: {
                                    target: 'opponent',
                                    type: 'physical',
                                    style: 'sword',
                                    animation: animations.waterSlash,
                                    elements: ['water'],
                                    baseDamage: 5,
                                    waterResistAmp: -1,
                                }
                            }
                        }
                    }
                ]
            }
        },
        {
            requirements: [
                {
                    description: 'Slay 30 monsters that are at least level 20 with a sword style weapon.',
                    requiredCount: 30,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'sword',
                        level: 20,
                    }
                }
            ],
            ability: {
                name: 'Water Guard',
                description: "Gain 6% physical protection. Increase your water resistance. Follow up your next 2 strikes with a 10 base damage attack and gain 6% physical protection.",
                animation: animations.waterBuff,
                type: 'physical',
                style: 'sword',
                target: 'self',
                elements: ['water'],
                speed: 3,
                waterResistAmp: 2,
                protection: {
                    physical: 6
                },
                addEffect: {
                    class: 'AbilityStrikeEffect',
                    inputData: {
                        strikeDuration: 2,
                        ability: {
                            animation: animations.waterSlash,
                            type: 'physical',
                            style: 'sword',
                            target: 'self',
                            elements: ['water'],
                            baseDamage: 10,
                            postActions: [
                                {
                                    target: TargetEnum.Self,
                                    type: PlayerActionType.Physical,
                                    style: PlayerActionStyle.Sword,
                                    elements: [ElementsEnum.Water],
                                    protection: {
                                        physical: 6
                                    },
                                }
                            ]
                        }
                    }
                },
                apCost: 1,
            }
        },
        {
            requirements: [
                {
                    description: 'Slay 40 monsters that are at least level 20 with a sword style weapon.',
                    requiredCount: 40,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'sword',
                        level: 20,
                    }
                }
            ],
            ability: {
                name: 'Cryo Knight',
                type: 'physical',
                style: 'sword',
                target: 'self',
                elements: ['ice'],
                speed: 3,
                addEffect: {
                    class: 'ImbueEffect',
                    inputData: {
                        element: 'ice',
                        roundsLeft: 1
                    }
                },
                apCost: 1,
                description: "Your weapon is imbued with ice for 1 round. All of your ice attacks slightly reduce the target's ice resistance for 2 turns. Follow up your next 2 strikes with a 30 base damage attack, and if your weapon is imbued with ice, the attack hits a second time.",
                animation: animations.waterBuff,
                postActions: [
                    {
                        target: 'self',
                        addEffect: {
                            class: 'AbilityStrikeEffect',
                            inputData: {
                                strikeDuration: 2,
                                ability: {
                                    type: 'physical',
                                    style: 'sword',
                                    animation: animations.cryoSlash,
                                    elements: ['ice'],
                                    target: 'opponent',
                                    baseDamage: 30,
                                    customActions: [
                                        {
                                            name: 'EffectBoost',
                                            data: {
                                                effectClass: 'ImbueEffect',
                                                imbueElements: ['ice'],
                                                target: 'self',
                                                extraActions: [
                                                    {
                                                        animation: animations.pyroSlash,
                                                        type: 'physical',
                                                        style: 'sword',
                                                        target: 'opponent',
                                                        elements: ['ice'],
                                                        baseDamage: 30
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    {
                        target: 'self',
                        addEffect: {
                            class: 'ActionTriggerEffect',
                            inputData: {
                                filter: {
                                    user: 'send',
                                    playerAction: {
                                        isAttack: true,
                                        elements: ['ice']
                                    }
                                },
                                ability: {
                                    target: 'opponent',
                                    type: 'physical',
                                    style: 'sword',
                                    elements: [ElementsEnum.Ice],
                                    iceResistAmp: -1
                                },
                                roundsLeft: 2
                            }
                        }
                    }
                ]
            }
        },
        {
            requirements: [
                {
                    description: 'Slay 50 monsters that are at least level 20 with a sword style weapon.',
                    requiredCount: 50,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'sword',
                        level: 20,
                    }
                }
            ],
            ability: {
                name: 'Water Titan Slash',
                type: 'physical',
                style: 'sword',
                target: 'opponent',
                baseDamage: 50,
                elements: ['water'],
                speed: 3,
                customActions: [
                    {
                        name: 'EffectBoost',
                        data: {
                            effectClass: 'DrenchedEffect',
                            extraActions: [
                                {
                                    target: 'self',
                                    waterResistAmp: -4
                                }
                            ]
                        }
                    }
                ],
                apCost: 2,
                description: "If the target is drenched, significantly decreases the target's water resistance.",
                animation: animations.waterSlash2
            }
        },
    ]
};

const lightningBlade = {
    name: "Lightning Blade",
    icon: "lightning_blade_book.webp",
    description: "Nothing compares to the striking power of lightning. It's monstrous roar bri ngs monsters to their knees. These sword techniques will increase your strength with the power of lightning.",
    abilities: [
        {
            requirements: [
                {
                    description: 'Slay 10 monsters that are at least level 20 with a sword style weapon.',
                    requiredCount: 10,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'sword',
                        level: 20,
                    }
                }
            ],
            ability: {
                name: 'Volt Slash',
                description: "Lightning surges through your blade as you slash your target causing a mighty discharge.",
                animation: animations.lightningSlash,
                type: 'physical',
                style: 'sword',
                target: 'opponent',
                elements: ['lightning'],
                speed: 3,
                baseDamage: 50,
                apCost: 1,
            }
        },
        {
            requirements: [
                {
                    description: 'Slay 20 monsters that are at least level 20 with a sword style weapon.',
                    requiredCount: 20,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'sword',
                        level: 20,
                    }
                }
            ],
            ability: {
                name: 'Static Thrust',
                type: 'physical',
                style: 'sword',
                target: 'opponent',
                description: "Follow up your next 2 strikes with a 5 base damage attack that slightly decrease the target's lightning resistance.",
                elements: ['lightning'],
                speed: 3,
                baseDamage: 40,
                apCost: 1,
                animation: animations.lightningThrust,
                postActions: [
                    {
                        target: 'self',
                        addEffect: {
                            class: 'AbilityStrikeEffect',
                            inputData: {
                                strikeDuration: 2,
                                ability: {
                                    target: 'opponent',
                                    type: 'physical',
                                    style: 'sword',
                                    animation: animations.electric3,
                                    elements: ['lightning'],
                                    baseDamage: 5,
                                    lightningResistAmp: -1,
                                }
                            }
                        }
                    }
                ]
            }
        },
        {
            requirements: [
                {
                    description: 'Slay 30 monsters that are at least level 20 with a sword style weapon.',
                    requiredCount: 30,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'sword',
                        level: 20,
                    }
                }
            ],
            ability: {
                name: 'Static Guard',
                type: 'physical',
                style: 'sword',
                description: "Gain 5% physical protection. Follow up your next 2 strikes with a 5 base damage attack and gain 5% physical protection.",
                animation: animations.electricBuff,
                target: 'self',
                elements: ['lightning'],
                apCost: 1,
                speed: 3,
                lightningResistAmp: 2,
                protection: {
                    physical: 6
                },
                addEffect: {
                    class: 'AbilityStrikeEffect',
                    inputData: {
                        strikeDuration: 2,
                        ability: {
                            type: PlayerActionType.Physical,
                            style: PlayerActionStyle.Sword,
                            animation: animations.electricBuff,
                            target: TargetEnum.Opponent,
                            baseDamage: 10,
                            elements: [ElementsEnum.Lightning],
                            postActions: [
                                {
                                    target: TargetEnum.Self,
                                    type: PlayerActionType.Physical,
                                    style: PlayerActionStyle.Sword,
                                    elements: [ElementsEnum.Lightning],
                                    protection: {
                                        physical: 6
                                    },
                                }
                            ]
                        }
                    }
                },
            }
        },
        {
            requirements: [
                {
                    description: 'Slay 40 monsters that are at least level 20 with a sword style weapon.',
                    requiredCount: 40,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'sword',
                        level: 20,
                    }
                }
            ],
            ability: {
                name: 'Electro Knight',
                type: 'physical',
                style: 'sword',
                elements: ['lightning'],
                speed: 0,
                addEffect: {
                    class: 'ImbueEffect',
                    inputData: {
                        element: 'lightning',
                        roundsLeft: 1
                    }
                },
                target: 'self',
                apCost: 1,
                description: "Your weapon is imbued with lightning for 1 round. All of your lightning attacks slightly reduce the target's lightning resistance for 2 turns. Follow up your next 2 strikes with a 30 base damage attack, and if your weapon is imbued with lightning, the attack hits a second time.",
                animation: animations.electricBuff,
                postActions: [
                    {
                        target: 'self',
                        addEffect: {
                            class: 'AbilityStrikeEffect',
                            inputData: {
                                strikeDuration: 2,
                                ability: {
                                    type: 'physical',
                                    style: 'sword',
                                    animation: animations.electroSlash,
                                    target: 'opponent',
                                    elements: ['lightning'],
                                    baseDamage: 30,
                                    customActions: [
                                        {
                                            name: 'EffectBoost',
                                            data: {
                                                effectClass: 'ImbueEffect',
                                                imbueElements: ['lightning'],
                                                target: 'self',
                                                extraActions: [
                                                    {
                                                        animation: animations.electroSlash,
                                                        target: 'opponent',
                                                        type: 'physical',
                                                        style: 'sword',
                                                        elements: ['lightning'],
                                                        baseDamage: 30
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    {
                        target: 'self',
                        addEffect: {
                            class: 'ActionTriggerEffect',
                            inputData: {
                                filter: {
                                    user: 'send',
                                    playerAction: {
                                        isAttack: true,
                                        elements: ['lightning']
                                    }
                                },
                                ability: {
                                    target: 'opponent',
                                    type: 'physical',
                                    style: 'sword',
                                    elements: ['lightning'],
                                    lightningResistAmp: -1
                                },
                                roundsLeft: 1
                            }
                        }
                    }
                ]
            }
        },
        {
            requirements: [
                {
                    description: 'Slay 50 monsters that are at least level 20 with a sword style weapon.',
                    requiredCount: 50,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'sword',
                        level: 20,
                    }
                }
            ],
            ability: {
                name: 'Lightning Overdrive',
                type: 'physical',
                style: 'sword',
                target: 'opponent',
                baseDamage: 60,
                elements: ['lightning'],
                speed: 3,
                customActions: [
                    {
                        name: 'EffectBoost',
                        /**@type {import('../battle-system/custom-actions/effect-boost').EffectBoostData} */
                        data: {
                            effectClass: 'SurgedEffect',
                            extraActions: [
                                {
                                    target: 'self',
                                    apChange: 1
                                }
                            ]
                        }
                    }
                ],
                apCost: 2,
                description: "If the target is surged, gain 1 AP.",
                animation: animations.lightningSlash1,
            }
        },
    ]
};
const books = {
    warriorMasteryI,
    wizardMasteryI,
    fireMagic,
    waterMagic,
    lightningMagic,
    fireBlade,
    waterBlade,
    lightningBlade
};

module.exports = books;