const TestItems = require("./test-effects");
const ItemsSeries1 = require('./items-series-1');

const ItemEffects = {
    ...TestItems,
    ...ItemsSeries1
};

module.exports = ItemEffects;