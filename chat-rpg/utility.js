
const EXP_MODIFIER = 6;

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

function flattenObjectArray(array) {
    const newArray = [];

    array.forEach(element => {
        newArray.push(JSON.stringify(element));
    });

    return newArray;
}

function unflattenObjectArray(array) {
    const newArray = [];

    array.forEach(element => {
        newArray.push(JSON.parse(element));
    });

    return newArray;
}

function findInObjectArray(arr, matcher, matchValue, flatten=true) {
    const item = arr.find(element => element[matcher] === matchValue);

    if(!item) {
        return;
    }

    return flatten ? JSON.stringify(item) : item;
}

chatRPGUtility = {
    random: Math.random,
    strikeAnim: {
        spriteSheet: 'Hit-Yellow.png',
        frameWidth: 1024,
        frameHeight: 1024,
        frameCount: 16,
        duration: 0.5,
        positioning: 'opponent'
    },
    defaultWeapon: {
        name: 'Fists',
        baseDamage: 10,
        speed: 3,
        strikeAbility: {
            name: 'Heavy Strike',
            baseDamage: 30
        },
        statGrowth: {
            maxHealth: 2,
            attack: 1,
            magic: 1,
            defence: 1
        }
    },
    setStatsAtLevel(player, growthObject, level) {
        player.maxHealth = Math.floor(growthObject.maxHealth * level + 10 + level);
        player.health = player.maxHealth;
        player.attack = Math.floor(growthObject.attack * level);
        player.magic =  Math.floor(growthObject.magic * level);
        player.defence = Math.floor(growthObject.defence * level);
        player.level = level;
        player.exp = 0;
        player.expToNextLevel = getExpToNextLevel(player.level);
    },

    levelUpPlayer(player, growthObject) {
        player.maxHealth += growthObject.maxHealth + 1;
        player.health = player.maxHealth;
        player.attack += growthObject.attack;
        player.magic +=  growthObject.magic;
        player.defence += growthObject.defence;
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
    getRandomIntInclusive,
    flattenObjectArray,
    unflattenObjectArray,
    findInObjectArray
};

module.exports = chatRPGUtility;