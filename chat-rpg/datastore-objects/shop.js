
const DatastoreObject = require('./datastore-object');
const utility = require('../../utility');
const chatRPGUtility = require('../utility');

/**
 * @typedef {Object} ShopData
 * @property {string} title 
 * @property {string} description 
 * @property {string} coinIcon 
 * @property {ShopItemData[]} products 
 */

class Shop extends DatastoreObject {
    constructor(objectData) {
        super(objectData);
    }

    constructNewObject(shop) {
        shop.title = 'Shop';
        shop.description = 'A place to buy cool new things!';
        shop.coinIcon = 'coin.webp';
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

    /**
     * @override
     * @returns {ShopData}
     */
    getData() {
        return /** @type {ShopData} */ (this.datastoreObject);
    }
}

/**
 * @typedef {Object} ShopItemData
 * @property {string} id
 * @property {number} price
 * @property {string} type
 * @property {Object} product
 */

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

    /**
     * @override
     * @returns {ShopItemData}
     */
    getData() {
        return /** @type {ShopItemData} */ (this.datastoreObject);
    }
}

module.exports = {Shop, ShopItem};