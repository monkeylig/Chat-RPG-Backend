const { Weapon } = require('../datastore-objects/weapon');
const animations = require('./animations');

const braveCutlass = new Weapon({
    name: 'Brave Cutlass',
    type: 'physical',
    style: 'sword',
    baseDamage: 10,
    speed: 2,
    strikeAbility: {
        name: 'Brave Engage',
        type: 'physical',
        style: 'sword',
        baseDamage: 55,
        defenseAmp: 2,
        speed: 2,
        description: 'Slightly increases the users defense.',
        animation: animations.blueStab1
    },
    statGrowth: {
        maxHealth: 2,
        strength: 1,
        magic: 1,
        defense: 2
    },
    description: 'A dependable weapon to take into any fight.',
    icon: 'brave_cutlass.webp'
}).getData();

module.exports = {
    braveCutlass
};