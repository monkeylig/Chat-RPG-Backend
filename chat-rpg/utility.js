/** 
 * @template {{}} TCon
 * @typedef {new (...args: any[]) => TCon} GConstructor
 */

const EXP_MODIFIER = 6;

function calcHitDamge(srclevel, baseDamage, attack, defense) {
    return ((2 * srclevel / 5 + 2) * baseDamage * attack / defense) / 50 + 2;
}

function expFunc(level) {
    if (level == 1) {
        return 0;
    }
    return Math.floor(level**3 * 5/4);
}
function getExpToNextLevel(level) {
    return expFunc(level + 1) - expFunc(level);
}

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
 * 
 * @param {any[]} arr 
 * @param {any} value 
 * @returns {any | undefined}
 */
function findAndRemoveFromArray(arr, value) {
    const objectIndex = arr.find(element => element === value);

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
    setStatsAtLevel(player, growthObject, level) {
        player.maxHealth = Math.floor(growthObject.maxHealth * level + 10 + level);
        player.health = player.maxHealth;
        player.strength = Math.floor(growthObject.strength * level);
        player.magic = Math.floor(growthObject.magic * level);
        player.defense = Math.floor(growthObject.defense * level);
        player.level = level;
        player.exp = 0;
        player.expToNextLevel = getExpToNextLevel(player.level);
    },

    levelUpPlayer(player, growthObject) {
        player.maxHealth += growthObject.maxHealth + 1;
        player.health = player.maxHealth;
        player.strength += growthObject.strength;
        player.magic +=  growthObject.magic;
        player.defense += growthObject.defense;
        player.level += 1;
        player.exp = 0;
        player.expToNextLevel = getExpToNextLevel(player.level);
    },

    addExpAndLevel(player, _exp, growthObject) {
        let exp = _exp

        while (exp > 0) {
            let expToAdd = Math.min(exp, player.expToNextLevel - player.exp);
            player.exp += expToAdd;
            exp -= expToAdd;

            if(player.exp == player.expToNextLevel) {
                this.levelUpPlayer(player, growthObject);
            }
        }
    },

    getMonsterExpGain(monster) {
        return Math.round(monster.expYield * monster.level/7 * EXP_MODIFIER);
    },
    findInObjectArray,
    findAndRemoveFromArray,
    calcHitDamge
};

module.exports = chatRPGUtility;