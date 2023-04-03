const utility = {
    genId() {
        return 'id' + Math.floor(Math.random() * 10000000);
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
        }
    }
}

module.exports = utility;