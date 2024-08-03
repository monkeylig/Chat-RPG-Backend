const Item = require("./datastore-objects/item");
const content = require("./content/content");

const gameplayObjects = {
    statusEffects: {
        ablazed: {
            name: 'ablazed',
            inflictChance: 0.30,
            trueDamage: 10,
            roundsLeft: 3
        },
        surged: {
            name: 'surged',
            inflictChance: 0.30,
            damagePercentage: 0.15,
            roundsLeft: 2
        },
        drenched: {
            name: 'drenched',
            healthThreshold: 0.20,
            trueDamage: 20,
            roundsLeft: 5,
        },
        frozen: {
            name: 'frozen',
            drenchedInflict: 0.5,
            attackChance: 0.5,
            roundsLeft: 3,
        }
    },
    startingWeapons: {
        physical: content.swords.braveCutlass,
        magical: content.staffs.duelistsBane
    },
    startingItems: {
        items: {
            potion: new Item({...content.items.potion.getData(), count: 10}),
            phoenixDown: new Item({...content.items.pheonixDown.getData(), count: 10})
        },
        books: {
            warriorMasteryI: content.books.warriorMasteryI,
            wizardMasteryI: content.books.wizardMasteryI
        }
    }
};

module.exports = gameplayObjects;