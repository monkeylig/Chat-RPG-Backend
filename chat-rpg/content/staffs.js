const { Weapon } = require('../datastore-objects/weapon');
const animations = require('./animations');

const duelistsBane = new Weapon({
    weaponNumber: 7,
    name: 'Duelist\'s Bane',
    type: 'magical',
    style: 'staff',
    baseDamage: 20,
    speed: 3,
    strikeAbility: {
        name: 'Magic Rush',
        type: 'magical',
        style: 'staff',
        baseDamage: 30,
        magicAmp: 1,
        description: "Slightly increase magic.",
        animation: animations.impact2
    },
    statGrowth: {
        maxHealth: 2,
        attack: 1,
        magic: 2,
        defence: 1
    },
    description: 'A difficult weapon to duel against.',
    icon: 'duelists_bane.png'
}).getData();

module.exports = {
    duelistsBane
};