const DatastoreObject = require('./datastore-object');
const utility = require('../../utility');
const chatRPGUtility = require('../utility');

class Shop extends DatastoreObject {
    constructor(objectData) {
        super(objectData);
    }

    constructNewObject(shop) {
        shop.title = 'Shop';
        shop.description = 'A place to buy cool new things!';
        shop.coinIcon = 'coin.png';
        shop.products = [];
    }

    addShopItem(shopItem) {
        const shopItemData = shopItem.getData();
        shopItemData.id = utility.genId();
        this.datastoreObject.products.push(shopItemData);
    }

    findProduct(productId) {
        const productData = chatRPGUtility.findInObjectArray(this.datastoreObject.products, 'id', productId);

        if(!productData) {
            return;
        }

        return new ShopItem(productData);
    }
}

class ShopItem extends DatastoreObject {
    constructor(objectData) {
        super(objectData);
    }

    constructNewObject(shopItem) {
        shopItem.id = '';
        shopItem.price = 0;
        shopItem.type = 'empty';
        shopItem.product = {};
    }
}

module.exports = {Shop, ShopItem};