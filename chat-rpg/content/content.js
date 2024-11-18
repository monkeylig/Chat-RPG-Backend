/**
 * @import {ItemData} from '../datastore-objects/item'
 */

const Item = require('../datastore-objects/item');
const books = require('./books');
const swords = require('./swords')
const staffs = require('./staffs')

/**@type {ItemData} */
const potion = {
    name:'Potion',
    icon: 'potion.webp',
    target: 'self',
    count: 1,
    heal: 100,
    outOfBattle: true,
    customActions: [
        {
            name: 'IsHealthFull',
            data: {
                invert: true
            }
        }
    ],
    description: 'Heals the user for 100 HP.'
};

/**@type {ItemData} */
const phoenixDown = {
    name:'Phoenix Down',
    icon: 'phoenix_down.webp',
    target: 'self',
    count: 1,
    outOfBattle: true,
    addEffect: {
        class: 'ReviveEffect',
        inputData: {
            healthRecoverPercent: 0.5
        }
    },
    customActions: [
        {
            name: 'IsReviveSet',
            data: {
                invert: true
            }
        }
    ],
    description: 'If the user is defeated, they will be revived with half of their maximum HP instead.'
};

const content = {
    books,
    items: {
        potion,
        phoenixDown: phoenixDown
    },
    swords,
    staffs
};

module.exports = content;