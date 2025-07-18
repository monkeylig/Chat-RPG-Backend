const animations = require('./animations');

const duelistsBane = {
    name: 'Duelist\'s Bane',
    stars: 1,
    type: 'magical',
    style: 'staff',
    baseDamage: 10,
    speed: 3,
    strikeAbility: {
        name: 'Magic Rush',
        type: 'magical',
        style: 'staff',
        target: 'opponent',
        baseDamage: 25,
        speed: 3,
        postActions: [
            {
                target: 'self',
                magicAmp: 1,
            }
        ],
        description: "Slightly increase your magic.",
        animation: animations.impact2
    },
    
    description: 'A difficult weapon to duel against.',
    icon: 'duelists_bane.webp'
};

module.exports = {
    duelistsBane
};