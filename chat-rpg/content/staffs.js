const { Weapon } = require('../datastore-objects/weapon');
const animations = require('./animations');

const duelistsBane = new Weapon({
    name: 'Duelist\'s Bane',
    type: 'magical',
    style: 'staff',
    baseDamage: 10,
    speed: 3,
    strikeAbility: {
        name: 'Magic Rush',
        type: 'magical',
        style: 'staff',
        baseDamage: 55,
        speed: 3,
        magicAmp: 1,
        description: "Slightly increases the user's magic.",
        animation: animations.impact2
    },
    statGrowth: {
        maxHealth: 2,
        strength: 1,
        magic: 2,
        defense: 1
    },
    description: 'A difficult weapon to duel against.',
    icon: 'duelists_bane.webp'
}).getData();

module.exports = {
    duelistsBane
};