const gameplayObjects = {
    statusEffects: {
        inflamed: {
            name: 'inflamed',
            inflictChance: 0.15,
            damagePercentage: 1/16,
            roundsLeft: 3
        },
        surged: {
            name: 'surged',
            inflictChance: 0.10,
            damagePercentage: 0.15,
            roundsLeft: 2
        },
        drenched: {
            name: 'drenched',
            healthThreshold: 0.15,
            lightningAmp: 0.2,
            roundsLeft: 5,
        },
        frozen: {
            name: 'frozen',
            drenchedInflict: 0.5,
            attackChance: 0.5,
            roundsLeft: 3,
        }
    }
};

module.exports = gameplayObjects;