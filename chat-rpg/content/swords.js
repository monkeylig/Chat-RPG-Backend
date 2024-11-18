const animations = require('./animations');

const braveCutlass = {
    name: 'Brave Cutlass',
    type: 'physical',
    style: 'sword',
    baseDamage: 10,
    speed: 2,
    strikeAbility: {
        name: 'Brave Engage',
        type: 'physical',
        style: 'sword',
        baseDamage: 30,
        target: 'opponent',
        speed: 2,
        description: 'Slightly increases the users defense.',
        animation: animations.blueStab1,
        postActions: [
            {
                target: 'self',
                defenseAmp: 1,
            }
        ]
    },
    description: 'A dependable weapon to take into any fight.',
    icon: 'brave_cutlass.webp',
};

module.exports = {
    braveCutlass
};