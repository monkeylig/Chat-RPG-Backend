/**
 * @import {ObjectMapper} from "../../object-mapping"
 */

const { Shop } = require("../shop");

test('lookUpPrice', () => {
    const shop = new Shop({
        /**@type {ObjectMapper} */
        priceListing: {
            keyFields: [
                {
                    key: {
                        mapFields: [
                            {
                                fieldName: 'type',
                                value: 'weapon'
                            }
                        ]
                    },
                    value: 10
                }
            ],
            default: 0
        }
    });

    expect(shop.lookUpPrice({type: 'weapon'})).toBe(10);
});

test('lookUpResellValue', () => {
    const shop = new Shop({
        /**@type {ObjectMapper} */
        resellListing: {
            keyFields: [
                {
                    key: {
                        mapFields: [
                            {
                                fieldName: 'type',
                                value: 'weapon'
                            }
                        ]
                    },
                    value: 10
                }
            ],
            default: 0
        }
    });

    expect(shop.lookUpResellValue({type: 'weapon'})).toBe(10);
});