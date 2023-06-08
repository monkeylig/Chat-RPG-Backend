const { v4: uuidv4 } = require('uuid');

const utility = {
    genId() {
        return uuidv4();
    },
    deepCopy(object) {
        return JSON.parse(JSON.stringify(object));
    },
    sampleData: {
        avatars: {
            starting_avatars: { 
                content: ["avatar1", "avatar2"]
            }
        },
        monsters: {
            monmon: {
                name: 'Monmon',
                monsterNumber: 0,
                attackRating: 0.25,
                defenceRating: 0.25,
                magicRating: 0.1,
                healthRating: 0.4,
                expYield: 36,
                weapon: {
                    name: "Club",
                    baseDamage: 10,
                    speed: 1,
                    strikeAbility: {
                        name: "Big Swing",
                        basedamage: 50
                    }
                }
            },
            bokumon: {
                name: 'Bokumon',
                monsterNumber: 1,
                attackRating: 0.25,
                defenceRating: 0.25,
                magicRating: 0.1,
                healthRating: 0.4,
                expYield: 36,
                weapon: {
                    name: "Club",
                    baseDamage: 10,
                    speed: 1,
                    strikeAbility: {
                        name: "Big Swing",
                        basedamage: 50
                    }
                }
            }
        },
        accounts: {
            testPlayer1: {
                abilities: [],
                bag: {
                    weapons: [
                        '{"name": "Glock19", "id": "weapon1"}'
                    ],
                    books: [
                        JSON.stringify({
                            name: "Test Book 1",
                            abilities: [
                                {
                                    name: "Big Bang",
                                    damage: 50
                                },
                                {
                                    name: "Super Blast",
                                    damage: 70
                                }
                            ]
                        })
                    ],
                    items: []
                }
            },
            testPlayer2: {
                abilities: [],
                bag: {
                    weapons: [
                        '{"name": "Glock19", "id": "weapon1"}'
                    ],
                    books: [],
                    items: []
                }
            }
        }
    }
}

module.exports = utility;