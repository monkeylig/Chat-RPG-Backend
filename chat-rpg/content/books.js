/**
 * @import {AbilityStrikeEffectData} from '../battle-system/effects/ability-strike-effect'
 * @import {CounterEffectData} from '../battle-system/effects/counter-effect'
 */

const { TargetEnum, PlayerActionType, PlayerActionStyle } = require('../battle-system/action');
const animations = require('./animations');

const warriorMasteryI = {
    name: 'Warrior Mastery',
    icon: 'warrior_mastery_1.webp',
    description: 'Every new warrior must begin somewhere. This book will introduce you to the play style of the warrior class. Pick up a sword and start unlocking these sleights!',
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
                speed: 5,
                baseDamage: 30,
                apCost: 1,
                description: "A very fast attack dealing modest damage. Increases the user's weapon speed.",
                animation: animations.orangeStab1,
                postActions: [
                    {
                        target: 'self',
                        weaponSpeedAmp: 2,
                    }
                ]
            }
        },
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
            ability: {
                name: 'Fury Assault',
                type: 'physical',
                style: 'sword',
                target: 'opponent',
                baseDamage: 35,
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
                    description: 'Slay 20 monsters with a sword style weapon.',
                    requiredCount: 20,
                    count: 0,
                    tracker: {
                        type: 'weaponStyleVictory',
                        value: 'sword'
                    }
                }
            ],
            ability: {
                name: 'Guardian Slash',
                type: 'physical',
                style: 'sword',
                target: 'opponent',
                baseDamage: 10,
                speed: 2,
                apCost: 1,
                description: "Gain 10% physical protection. Follow up your next 2 strikes with a 5 base damage attack and gain 5% physical protection.",
                animation: animations.blueSlash3,
                postActions: [
                    {
                        target: 'self',
                        protection: {
                            physical: 10
                        },
                        addEffect: {
                            class: 'AbilityStrikeEffect',
                            inputData: {
                                strikeDuration: 2,
                                ability: {
                                    animation: animations.blueSlash2,
                                    type: PlayerActionType.Physical,
                                    style: PlayerActionStyle.Sword,
                                    target: TargetEnum.Opponent,
                                    baseDamage: 5,
                                    postAction: [
                                        {
                                            animation: animations.swordBuff1,
                                            target: TargetEnum.Self,
                                            protection: {
                                                physical: 5
                                            },
                                        }
                                    ]
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
                    description: 'Slay 30 monsters with a sword style weapon.',
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
                description: "Counters the target's strike with a 30 base damage, physical-sword attack.",
                animation: animations.swordBuff1,
                type: 'physical',
                style: 'staff',
                target: 'self',
                speed: 0,
                priority: 10,
                apCost: 1,
                addEffect: {
                    class: 'CounterEffect',
                    /**@type {CounterEffectData} */
                    inputData: {
                        filter: {
                            attackType: 'strike'
                        },
                        ability: {
                            name: 'Parry',
                            target: 'opponent',
                            type: 'physical',
                            style: 'sword',
                            baseDamage: 30,
                            animation: animations.impact7
                        }
                    }
                }
            }
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
            ability: {
                name: 'Mega Slash',
                type: 'physical',
                style: 'sword',
                target: 'opponent',
                baseDamage: 75,
                speed: 3,
                apCost: 2,
                description: "A mighty feat of strength doing great damage.",
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
                type: 'magical',
                style: 'staff',
                target: 'opponent',
                baseDamage: 50,
                speed: 3,
                apCost: 1,
                description: "A bolt of energy dealing magical damage.",
                animation: animations.impact2
            }
        },
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
            ability: {
                name: 'Arcania',
                type: 'magical',
                style: 'staff',
                target: 'self',
                speed: 3,
                magicAmp: 2,
                apCost: 1,
                description: "Slightly increase your magic. Gain the ability Arcane Burst",
                animation: animations.magicBuff1,
                addAbility: {
                    name: 'Arcane Burst',
                    type: 'magical',
                    style: 'staff',
                    target: 'opponent',
                    charges: 1,
                    baseDamage: 65,
                    speed: 3,
                    description: 'The user summons a surplus of magical energy and releases it in a small burst.',
                    animation: animations.impact7
                }
            }
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
            ability: {
                name: 'Protect',
                type: 'magical',
                style: 'staff',
                target: 'self',
                speed: 3,
                protection: {
                    magical: 10
                },
                apCost: 1,
                description: "Gain 10% magical protection. Gain the ability Repel.",
                animation: animations.magicBuff1,
                addAbility: {
                    name: 'Repel',
                    description: 'If the target strikes the user it does nothing, and the user attacks the target instead.',
                    animation: animations.magicBuff1,
                    type: 'magical',
                    style: 'staff',
                    target: 'self',
                    priority: 10,
                    speed: 0,
                    charges: 1,
                    addEffect: {
                        class: 'CounterEffect',
                        /**@type {CounterEffectData} */
                        inputData: {
                            filter: {
                                attackType: 'strike'
                            },
                            /**@type {AbilityData} */
                            ability: {
                                name: 'Repel',
                                target: 'opponent',
                                baseDamage: 50,
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
                    description: 'Slay 30 monsters with a staff style weapon.',
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
                type: 'magical',
                style: 'staff',
                target: 'self',
                speed: 3,
                empowerment: {
                    magical: 75
                },
                apCost: 1,
                description: "The user gains 75 magical empowerment",
                animation: animations.magicBuff1
            }
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
            /**@type {TopLevelAbilityData} */
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

const books = {
    warriorMasteryI,
    wizardMasteryI
};

module.exports = books;