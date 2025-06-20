/**
 * @module ObjectMapper
 */
/**
 * @typedef {Object} MapField
 * @property {any} value - The value of the field
 * @property {string} fieldName - The name of the field
 * @property {string} [comparisonMethod] - The comparison method used for this field. If none is given then '=' is used.
 * @property {KeyMapper} [nextMapper] - The next mapper to use if this one passed. Creates a logical AND.
 */
/**
 * 
 * @typedef {Object} KeyMapper
 * @property {MapField[]} mapFields - An array of fields that must pass at least one comparison test for an object to match.
 */
/** 
 * 
 * @typedef {Object} ObjectMapper - Describes how to map an arbitrary object to a value.
 * @property {{key: KeyMapper, value: any}[]} keyFields - An array of keys to value pairings.
 * @property {any} default - The default value of an object if no mapping is found.
 */


/**
 * Return the value that is mapped to the key object using the map.
 * @param {Object} key - The input object.
 * @param {ObjectMapper} map - The map to use to find the object's value.
 * @returns {any}
 */
function getObjectMapValue(key, map) {
    if (!key || !map) {
        return;
    }

    // Find the key that matches the object
    for (const keyField of map.keyFields) {
        if (matchKeyMapper(key, keyField.key)) {
            return keyField.value;
        }
    }

    return map.default;
}

/**
 * @private
 * @param {Object} key 
 * @param {KeyMapper} keyMapper 
 * @returns {boolean}
 */
function matchKeyMapper(key, keyMapper) {
    if (!key || !keyMapper) {
        return false;
    }

    if (keyMapper.mapFields.length == 0) {
        return true;
    }

    // All nested keyMappers must pass
    const nestedKeyMappers = [keyMapper];

    while (nestedKeyMappers.length > 0) {
        const currentKeyMapper = nestedKeyMappers.pop();
        if (!currentKeyMapper) {
            continue;
        }

        for (const mapField of currentKeyMapper.mapFields) {
            if (matchMapField(key, mapField)) {
                if (mapField.nextMapper) {
                    nestedKeyMappers.push(mapField.nextMapper);
                }
                else {
                    return true;
                }
            }
        }
    }

    return false;
}

/**
 * 
 * @private
 * @param {Object} key 
 * @param {MapField} mapField
 * @returns {boolean} 
 */
function matchMapField(key, mapField) {
    if (!key || !mapField) {
        return false;
    }

    // TODO: Support other comparison methods
    if (key[mapField.fieldName] == mapField.value) {
        return true;
    }

    return false;
}

module.exports = {
    getObjectMapValue
};