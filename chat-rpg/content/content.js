const Item = require('../datastore-objects/item');
const books = require('./books');

const potion = new Item ({
    name:'Potion',
    effectName: 'potion',
    icon: 'potion.webp',
    count: 1,
    heal: 100,
    description: 'Heals the user for 100 HP.'
});

const pheonixDown = new Item({
    name:'Phoenix Down',
    effectName: 'pheonixDown',
    icon: 'phoenix_down.webp',
    count: 1,
    description: 'If the user is defeated, they will be revived with 75% of their maximum HP instead.'
});

const content = {
    books,
    items: {
        potion,
        pheonixDown
    }
};

module.exports = content;