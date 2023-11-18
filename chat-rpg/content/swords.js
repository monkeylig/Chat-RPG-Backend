const { Weapon } = require('../datastore-objects/weapon');
const animations = require('./animations');

const braveCutlass = new Weapon({
    weaponNumber: 2,
    name: 'Brave Cutlass',
    type: 'physical',
    style: 'sword',
    baseDamage: 20,
    speed: 2,
    strikeAbility: {
        name: 'Brave Engage',
        type: 'physical',
        style: 'sword',
        baseDamage: 65,
        defenceAmp: 2,
        description: 'Slightly increases defense.',
        animation: animations.blueStab1
    },
    statGrowth: {
        maxHealth: 2,
        attack: 1,
        magic: 1,
        defence: 2
    },
    description: 'A dependable weapon to take into any fight.',
    icon: 'brave_cutlass.webp'
}).getData();

module.exports = {
    braveCutlass
};