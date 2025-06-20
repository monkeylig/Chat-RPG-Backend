/**
 * @import {ObjectMapper} from '../object-mapping'
 */

const DatastoreObject = require('./datastore-object');
const utility = require('../../utility');
const chatRPGUtility = require('../utility');
const {getObjectMapValue} = require('../object-mapping');

/**
 * @typedef {Object} ShopData
 * @property {string} title 
 * @property {string} description 
 * @property {string} coinIcon 
 * @property {ShopItemData[]} products 
 * @property {ObjectMapper} priceListing
 * @property {ObjectMapper} resellListing
 */

class Shop extends DatastoreObject {
    constructor(objectData) {
        super(objectData);
    }

    /**
     * 
     * @param {ShopData} shop 
     */
    constructNewObject(shop) {
        shop.title = 'Shop';
        shop.description = 'A place to buy cool new things!';
        shop.coinIcon = 'coin.webp';
        shop.products = [];
        shop.priceListing = {
            keyFields: [],
            default: 0
        };
        shop.resellListing = {
            keyFields: [],
            default: 0
        };
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
     * 
     * @param {Object} product 
     * @returns {number}
     */
    lookUpPrice(product) {
        const shop = this.getData();
        return getObjectMapValue(product, shop.priceListing);
    }

    /**
     * 
     * @param {Object} product 
     * @returns {number}
     */
    lookUpResellValue(product) {
        const shop = this.getData();
        return getObjectMapValue(product, shop.resellListing);
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