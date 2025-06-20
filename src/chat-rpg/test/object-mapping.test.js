/**
 * @import {ObjectMapper} from "../object-mapping"
 */

const { getObjectMapValue } = require("../object-mapping");

test('Null values', () => {
    // @ts-ignore
    expect(getObjectMapValue()).toBeUndefined();
    // @ts-ignore
    expect(getObjectMapValue({})).toBeUndefined();
    // @ts-ignore
    expect(getObjectMapValue(null, {})).toBeUndefined();
});

test('Real Mappings', () => {
    /**@type {ObjectMapper} */
    const mapper = {
        keyFields: [
            {
                key: {
                    mapFields: [
                        {
                            value: 'rex',
                            fieldName: "name"
                        }
                    ]
                },
                value: 20
            }
        ],
        default: undefined
    };

    const testObject = {
        name: 'rex'
    }
    expect(getObjectMapValue(testObject, mapper)).toBe(20);
});

test('Multiple Mappings', () => {
    /**@type {ObjectMapper} */
    const mapper = {
        keyFields: [
            {
                key: {
                    mapFields: [
                        {
                            value: 'rex',
                            fieldName: "name"
                        }
                    ]
                },
                value: 20
            },
            {
                key: {
                    mapFields: [
                        {
                            value: 'groot',
                            fieldName: "name"
                        }
                    ]
                },
                value: 40
            },
        ],
        default: undefined
    };

    const testObject = {
        name: 'groot'
    }
    expect(getObjectMapValue(testObject, mapper)).toBe(40);

    testObject.name = 'rex';

    expect(getObjectMapValue(testObject, mapper)).toBe(20);
});

test("Multiple Mappings with OR'ed keys", () => {
    /**@type {ObjectMapper} */
    const mapper = {
        keyFields: [
            {
                key: {
                    mapFields: [
                        {
                            value: 'rex',
                            fieldName: "name"
                        },
                        {
                            value: 'flex',
                            fieldName: "name"
                        }
                    ]
                },
                value: 20
            },
            {
                key: {
                    mapFields: [
                        {
                            value: 'groot',
                            fieldName: "name"
                        },
                        {
                            value: 'smoot',
                            fieldName: "name"
                        }
                    ]
                },
                value: 40
            },
        ],
        default: undefined
    };

    const testObject = {
        name: 'flex'
    }
    expect(getObjectMapValue(testObject, mapper)).toBe(20);

    testObject.name = 'smoot';

    expect(getObjectMapValue(testObject, mapper)).toBe(40);
});

test("Multiple Mappings with AND'ed keys", () => {
    /**@type {ObjectMapper} */
    const mapper = {
        keyFields: [
            {
                key: {
                    mapFields: [
                        {
                            value: 'rex',
                            fieldName: "name",
                            nextMapper: {
                                mapFields: [
                                    {
                                        value: 10,
                                        fieldName: "coins"
                                    }
                                ]
                            }
                        },
                        {
                            value: 'flex',
                            fieldName: "name"
                        }
                    ]
                },
                value: 20
            },
            {
                key: {
                    mapFields: [
                        {
                            value: 'groot',
                            fieldName: "name"
                        },
                        {
                            value: 'smoot',
                            fieldName: "name",
                            nextMapper: {
                                mapFields: [
                                    {
                                        value: 5,
                                        fieldName: "coins"
                                    }
                                ]
                            }
                        }
                    ]
                },
                value: 40
            },
        ],
        default: 0
    };

    const testObject = {
        name: 'rex',
        coins: 0
    }
    expect(getObjectMapValue(testObject, mapper)).toBe(0);

    testObject.coins = 10;

    expect(getObjectMapValue(testObject, mapper)).toBe(20);
});

test('No Mappings, default value', () => {
    /**@type {ObjectMapper} */
    const mapper = {
        keyFields: [],
        default: "No Mappings"
    };

    const testObject = {
        name: 'rex'
    }
    expect(getObjectMapValue(testObject, mapper)).toMatch("No Mappings");
});

test('Empty Key', () => {
    /**@type {ObjectMapper} */
    const mapper = {
        keyFields: [
            {
                key: {
                    mapFields: []
                },
                value: 20
            }
        ],
        default: undefined
    };

    const testObject = {
        name: 'rex'
    }
    expect(getObjectMapValue(testObject, mapper)).toBe(20);
});

test('Key compare fails, go to default value.', () => {
    /**@type {ObjectMapper} */
    const mapper = {
        keyFields: [
            {
                key: {
                    mapFields: [
                        {
                            value: 'rex0',
                            fieldName: "name"
                        }
                    ]
                },
                value: 20
            }
        ],
        default: "no can do"
    };

    const testObject = {
        name: 'rex'
    }
    expect(getObjectMapValue(testObject, mapper)).toMatch("no can do");
});

test('Key compare fails, go to default value as number.', () => {
    /**@type {ObjectMapper} */
    const mapper = {
        keyFields: [
            {
                key: {
                    mapFields: [
                        {
                            value: 'rex0',
                            fieldName: "name"
                        }
                    ]
                },
                value: 20
            }
        ],
        default: 32
    };

    const testObject = {
        name: 'rex'
    }
    expect(getObjectMapValue(testObject, mapper)).toBe(32);
});


