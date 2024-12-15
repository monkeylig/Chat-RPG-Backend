const Item = require("./datastore-objects/item");
const content = require("./content/content");

const gameplayObjects = {
    statusEffects: {
        ablazed: {
            name: 'ablazed',
            inflictChance: 0.30,
            trueDamage: 6,
            roundsLeft: 3
        },
        surged: {
            name: 'surged',
            inflictChance: 0.30,
            trueDamage: 12,
            roundsLeft: 2
        },
        drenched: {
            name: 'drenched',
            healthThreshold: 0.15,
            trueDamage: 5,
            roundsLeft: 5,
        },
        frozen: {
            name: 'frozen',
            drenchedInflict: 0.5,
            attackChance: 1,
            roundsLeft: 1,
        }
    },
    startingWeapons: {
        physical: content.swords.braveCutlass,
        magical: content.staffs.duelistsBane
    },
    startingItems: {
        items: {
            potion: new Item({...content.items.potion, count: 10}),
            phoenixDown: new Item({...content.items.phoenixDown, count: 10})
        },
        books: {
            warriorMasteryI: content.books.warriorMasteryI,
            wizardMasteryI: content.books.wizardMasteryI
        }
    },
    content
};

module.exports = gameplayObjects;