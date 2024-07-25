const chatRPGUtility = require('./utility');

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

function getMonsterExpGain(monster) {
    return Math.round(monster.expYield * monster.level/7 * EXP_MODIFIER);
}

test('Set Player Level', () => {
    const player = {};
    let growthObject = {
        maxHealth: 3,
        strength: 2,
        magic: 4,
        defense: 1
    };

    let level = 78;
    chatRPGUtility.setStatsAtLevel(player, growthObject, level);

    expect(player.maxHealth).toBe(growthObject.maxHealth * level + level + 10);
    expect(player.health).toBe(player.maxHealth);
    expect(player.strength).toBe(growthObject.strength * level);
    expect(player.magic).toBe(growthObject.magic * level);
    expect(player.defense).toBe(growthObject.defense * level);
    expect(player.level).toBe(level);

    level = 1;
    chatRPGUtility.setStatsAtLevel(player, growthObject, level);

    expect(player.maxHealth).toBe(growthObject.maxHealth * level + level + 10);
    expect(player.health).toBe(player.maxHealth);
    expect(player.strength).toBe(growthObject.strength * level);
    expect(player.magic).toBe(growthObject.magic * level);
    expect(player.defense).toBe(growthObject.defense * level);
    expect(player.level).toBe(level);

    level = 0;
    chatRPGUtility.setStatsAtLevel(player, growthObject, level);

    expect(player.maxHealth).toBe(growthObject.maxHealth * level + level + 10);
    expect(player.health).toBe(player.maxHealth);
    expect(player.strength).toBe(growthObject.strength * level);
    expect(player.magic).toBe(growthObject.magic * level);
    expect(player.defense).toBe(growthObject.defense * level);
    expect(player.level).toBe(level);
});

test('Level Up Player', () => {
    const player = {};
    let growthObject = {
        maxHealth: 3,
        strength: 2,
        magic: 4,
        defense: 1
    };

    let level = 1;
    chatRPGUtility.setStatsAtLevel(player, growthObject, level);
    chatRPGUtility.levelUpPlayer(player, growthObject);
    level += 1;

    expect(player.maxHealth).toBe(growthObject.maxHealth * level + level + 10);
    expect(player.health).toBe(player.maxHealth);
    expect(player.strength).toBe(growthObject.strength * level);
    expect(player.magic).toBe(growthObject.magic * level);
    expect(player.defense).toBe(growthObject.defense * level);
    expect(player.level).toBe(level);

    chatRPGUtility.levelUpPlayer(player, growthObject);
    level += 1;

    expect(player.maxHealth).toBe(growthObject.maxHealth * level + level + 10);
    expect(player.health).toBe(player.maxHealth);
    expect(player.strength).toBe(growthObject.strength * level);
    expect(player.magic).toBe(growthObject.magic * level);
    expect(player.defense).toBe(growthObject.defense * level);
    expect(player.level).toBe(level);

    chatRPGUtility.levelUpPlayer(player, growthObject);
    level += 1;
    chatRPGUtility.levelUpPlayer(player, growthObject);
    level += 1;

    expect(player.maxHealth).toBe(growthObject.maxHealth * level + level + 10);
    expect(player.health).toBe(player.maxHealth);
    expect(player.strength).toBe(growthObject.strength * level);
    expect(player.magic).toBe(growthObject.magic * level);
    expect(player.defense).toBe(growthObject.defense * level);
    expect(player.level).toBe(level);
});

test('Gaining Experience', () => {

    const player = {};
    let growthObject = {
        maxHealth: 3,
        strength: 2,
        magic: 4,
        defense: 1
    };

    let level = 1;
    chatRPGUtility.setStatsAtLevel(player, growthObject, level);

    expect(player.exp).toBe(0);
    expect(player.expToNextLevel).toBe(getExpToNextLevel(level));

    chatRPGUtility.addExpAndLevel(player, 10, growthObject);
    level += 1;

    expect(player.exp).toBe(0);
    expect(player.level).toBe(level);
    expect(player.expToNextLevel).toBe(getExpToNextLevel(level));

    chatRPGUtility.addExpAndLevel(player, 15, growthObject);

    expect(player.exp).toBe(15);
    expect(player.level).toBe(level);
    expect(player.expToNextLevel).toBe(getExpToNextLevel(level));

    chatRPGUtility.addExpAndLevel(player, 25, growthObject);
    level += 1;

    expect(player.exp).toBe(17);
    expect(player.level).toBe(level);
    expect(player.expToNextLevel).toBe(getExpToNextLevel(level));

    chatRPGUtility.addExpAndLevel(player, 0, growthObject);

    expect(player.exp).toBe(17);
    expect(player.level).toBe(level);
    expect(player.expToNextLevel).toBe(getExpToNextLevel(level));
});

test('Calculating exp gain from monsters', () => {
    const monster = {
        level: 1,
        expYield: 10
    };

    let exp = chatRPGUtility.getMonsterExpGain(monster);

    expect(exp).toBe(getMonsterExpGain(monster));
    
    monster.level += 1;
    exp = chatRPGUtility.getMonsterExpGain(monster);
    expect(exp).toBe(getMonsterExpGain(monster));

    monster.level += 1;
    exp = chatRPGUtility.getMonsterExpGain(monster);
    expect(exp).toBe(getMonsterExpGain(monster));

    monster.level += 1;
    exp = chatRPGUtility.getMonsterExpGain(monster);
    expect(exp).toBe(getMonsterExpGain(monster));

    monster.level += 1;
    exp = chatRPGUtility.getMonsterExpGain(monster);
    expect(exp).toBe(getMonsterExpGain(monster));

    monster.level += 1;
    exp = chatRPGUtility.getMonsterExpGain(monster);
    expect(exp).toBe(getMonsterExpGain(monster));

});

test('True Damage', () => {
    const damage = chatRPGUtility.calcTrueDamage(50, 50);

    expect(damage).toBe(50);
});
