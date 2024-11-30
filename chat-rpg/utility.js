/** 
 * @template {{}} TCon
 * @typedef {new (...args: any[]) => TCon} GConstructor
 */

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(chatRPGUtility.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
}

function chance(chanceValue) {
    if (chanceValue == 0) {
        return 0;
    }

    return chatRPGUtility.random() < chanceValue;
}

function findInObjectArray(arr, matcher, matchValue) {
    const item = arr.find(element => element[matcher] === matchValue);
    return item;
}

/**
 * @template {any} T
 * 
 * @param {T[]} arr 
 * @param {T} value 
 * @returns {T | undefined}
 */
function findAndRemoveFromArray(arr, value) {
    const objectIndex = arr.findIndex(element => element === value);

    if(objectIndex === -1) {
        return;
    }

    const objectData = arr.splice(objectIndex, 1);
    return objectData[0];
}

const chatRPGUtility = {
    random: Math.random,
    getRandomIntInclusive,
    chance,
    strikeAnim: {
        spriteSheet: 'Hit-Yellow.webp',
        frameWidth: 1024,
        frameHeight: 1024,
        columns: 16,
        rows: 1,
        duration: 500,
    },
    defaultWeapon: {
        name: 'Fists',
        type: 'physical',
        style: 'melee',
        baseDamage: 10,
        speed: 3,
        icon: 'fist.png',
        /** @type {import("./datastore-objects/ability").AbilityData} */
        strikeAbility: {
            name: 'Heavy Strike',
            baseDamage: 30,
            type: 'physical',
            style: 'fist',
            speed: 3,
            target: 'opponent',
            description: 'A heavy punch',
            animation: {}
        },
        statGrowth: {
            maxHealth: 2,
            strength: 1,
            magic: 1,
            defense: 1
        }
    },
    findInObjectArray,
    findAndRemoveFromArray,
};

module.exports = chatRPGUtility;