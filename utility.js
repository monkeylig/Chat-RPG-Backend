const { v4: uuidv4 } = require('uuid');

const utility = {
    genId() {
        return uuidv4();
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
                bag: {
                    weapons: [
                        '{"name": "Glock19", "id": "weapon1"}'
                    ]
                }
            },
            testPlayer2: {
                bag: {
                    weapons: [
                        '{"name": "Glock19", "id": "weapon1"}'
                    ]
                }
            }
        }
    }
}

module.exports = utility;