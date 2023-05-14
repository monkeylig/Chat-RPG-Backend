const DatastoreObject = require('./datastore-object');
const chatRPGUtility = require('../utility');
const utility = require("../../utility");

function expFunc(level) {
    if (level == 1) {
        return 0;
    }
    return Math.floor(level**3 * 5/4);
}

function getExpToNextLevel(level) {
    return expFunc(level + 1) - expFunc(level);
}

function setStatsAtLevel(player, growthObject, level) {
    player.maxHealth = Math.floor(growthObject.maxHealth * level + 10 + level);
    player.health = player.maxHealth;
    player.attack = Math.floor(growthObject.attack * level);
    player.magic =  Math.floor(growthObject.magic * level);
    player.defence = Math.floor(growthObject.defence * level);
    player.level = level;
    player.exp = 0;
    player.expToNextLevel = getExpToNextLevel(player.level);
}

function levelUpPlayer(player, growthObject) {
    player.maxHealth += growthObject.maxHealth + 1;
    player.health = player.maxHealth;
    player.attack += growthObject.attack;
    player.magic +=  growthObject.magic;
    player.defence += growthObject.defence;
    player.level += 1;
    player.exp = 0;
    player.expToNextLevel = getExpToNextLevel(player.level);
}

function addExpAndLevel(player, _exp, growthObject) {
    let exp = _exp

    while (exp > 0) {
        let expToAdd = Math.min(exp, player.expToNextLevel - player.exp);
        player.exp += expToAdd;
        exp -= expToAdd;

        if(player.exp == player.expToNextLevel) {
            levelUpPlayer(player, growthObject);
        }
    }
}

class Agent extends DatastoreObject {

    constructor(objectData) {
        super(objectData);
    }

    constructNewObject(agent) {
        agent.name = 'Unknown';
        agent.avatar = 'unknown.png';
        agent.abilities = '';
        agent.weapon = {
            name: 'Fists',
            baseDamage: 10,
            speed: 3,
            icon: 'fist.png',
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
        }

        setStatsAtLevel(agent, agent.weapon.statGrowth, 1);
    }

    setStatsAtLevel(level) {
        const player = this.datastoreObject;
        setStatsAtLevel(player, player.weapon.statGrowth, level);
    }

    levelUp() {
        const player = this.datastoreObject;
        levelUpPlayer(player, player.weapon.statGrowth);
    }

    addExpAndLevel(_exp) {
        const player = this.datastoreObject;
        let exp = _exp;

        addExpAndLevel(player, exp, player.weapon.statGrowth);
    }

    isDefeated() {
        return this.datastoreObject.health <= 0;
    }
}

class Player extends Agent {
    static MAXWEAPONS = 10;
    constructor(objectData) {
        super(objectData);

        const weapons = this.datastoreObject.bag.weapons;
        this.datastoreObject.bag.weapons = chatRPGUtility.unflattenObjectArray(weapons);

        const lastDropWeapons = this.datastoreObject.lastDrops.weapons;
        this.datastoreObject.lastDrops.weapons = chatRPGUtility.unflattenObjectArray(lastDropWeapons);
    }

    constructNewObject(agent) {
        super.constructNewObject(agent);
        agent.twitchId = '';
        agent.currentGameId = '';
        agent.bag = {
            weapons: []
        }
        agent.lastDrops = {
            weapons: []
        };
    }

    getData() {
        const newData = Object.assign({}, this.datastoreObject);
        newData.bag.weapons = chatRPGUtility.flattenObjectArray(newData.bag.weapons);
        newData.lastDrops.weapons = chatRPGUtility.flattenObjectArray(newData.lastDrops.weapons);
        return newData;
    }

    getUnflattenedData() {
        return this.datastoreObject;
    }

    addWeapon(weapon) {
        const weapons = this.datastoreObject.bag.weapons;
        if(weapons.length >= Player.MAXWEAPONS) {
            return false;
        }

        weapon.id = utility.genId();
        weapons.push(weapon);
        return true;
    }

    hasWeapon(weapon) {
        for(const _weapon of this.datastoreObject.bag.weapons) {
            if(weapon.name === _weapon.name) {
                return true;
            }
        }

        return false;
    }

    findWeaponById(weaponId, flatten=true) {
        const weapon = this.datastoreObject.bag.weapons.find(element => element.id === weaponId);

        if(!weapon) {
            return;
        }

        return flatten ? JSON.stringify(weapon) : weapon;
    }

    equipWeapon(weapon) {
        this.datastoreObject.weapon = weapon;
    }

    dropWeapon(weaponId) {
        const weaponIndex = this.datastoreObject.bag.weapons.findIndex(element => element.id === weaponId);

        if(weaponIndex === -1) {
            return;
        }

        let currentWeapon = this.datastoreObject.weapon;

        if(currentWeapon.id === weaponId) {
            currentWeapon = chatRPGUtility.defaultWeapon;
        }

        this.datastoreObject.bag.weapons.splice(weaponIndex, 1);
    }

    setLastDrop(lastDrop) {
        this.datastoreObject.lastDrops = lastDrop;
    }

    isWeaponEquipped(weaponId) {
        return this.datastoreObject.weapon.id === weaponId
    }
}

class Monster extends Agent {
    static EXP_MODIFIER = 6;
    static STAT_POINTS_PER_LEVEL = 5;

    constructor(objectData) {
        super(objectData);
    }

    constructNewObject(monster) {
        super.constructNewObject(monster);
        monster.expYield = 0;
        monster.id = 0;
        monster.attackRating = 0;
        monster.magicRating = 0;
        monster.defenceRating = 0;
        monster.healthRating = 0;
    }

    getExpGain() {
        const monster = this.datastoreObject;
        return Math.round(monster.expYield * monster.level/7 * Monster.EXP_MODIFIER);
    }

    setStatsAtLevel(level) {
        const monster = this.datastoreObject;
        setStatsAtLevel(monster, {
            maxHealth: monster.healthRating * Monster.STAT_POINTS_PER_LEVEL,
            attack: monster.attackRating * Monster.STAT_POINTS_PER_LEVEL,
            defence: monster.defenceRating * Monster.STAT_POINTS_PER_LEVEL,
            magic: monster.magicRating * Monster.STAT_POINTS_PER_LEVEL,
        }, level);
    }
}

module.exports = {Agent, Player, Monster};