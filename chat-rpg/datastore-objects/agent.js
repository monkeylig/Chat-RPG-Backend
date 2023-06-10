const DatastoreObject = require('./datastore-object');
const chatRPGUtility = require('../utility');
const utility = require("../../utility");
const Item = require('./item');

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

    static MAXABILITIES = 3;
    constructor(objectData) {
        super(objectData);
        const abilities = this.datastoreObject.abilities;
        if(typeof abilities[0] === 'string') {
            this.datastoreObject.abilities = chatRPGUtility.unflattenObjectArray(abilities);
        }
    }

    constructNewObject(agent) {
        agent.name = 'Unknown';
        agent.avatar = 'unknown.png';
        agent.abilities = [];
        agent.weapon = {
            name: 'Fists',
            type: 'sword',
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

    findAbilityByName(name, flatten=true) {
        const ability = this.datastoreObject.abilities.find(element => element.name == name);

        if(!ability) {
            return;
        }

        return flatten ? JSON.stringify(ability) : ability;
    }

    equipAbility(ability, replacedAbilityName)
    {
        const abilities = this.datastoreObject.abilities;
        let abilityIndex;

        if(replacedAbilityName) {
            abilityIndex = abilities.findIndex(element => element.name === replacedAbilityName)

            if(abilityIndex === -1) {
                return;
            }

            abilities[abilityIndex] = ability;
        }
        else if (this.hasOpenAbilitySlot()) {
            abilities.push(ability);
        }
    }

    hasOpenAbilitySlot() {
        return this.datastoreObject.abilities.length < Agent.MAXABILITIES;
    }

    getData() {
        const newData = JSON.parse(JSON.stringify(this.datastoreObject));
        newData.abilities = chatRPGUtility.flattenObjectArray(newData.abilities);
        return newData;
    }

    getUnflattenedData() {
        return this.datastoreObject;
    }
}

class Player extends Agent {
    static MAXWEAPONS = 10;
    constructor(objectData) {
        super(objectData);

        const weapons = this.datastoreObject.bag.weapons;
        this.datastoreObject.bag.weapons = chatRPGUtility.unflattenObjectArray(weapons);

        const books = this.datastoreObject.bag.books;
        this.datastoreObject.bag.books = chatRPGUtility.unflattenObjectArray(books);

        const items = this.datastoreObject.bag.items;
        this.datastoreObject.bag.items = chatRPGUtility.unflattenObjectArray(items);

        const lastDropWeapons = this.datastoreObject.lastDrops.weapons;
        this.datastoreObject.lastDrops.weapons = chatRPGUtility.unflattenObjectArray(lastDropWeapons);
    }

    constructNewObject(agent) {
        super.constructNewObject(agent);
        agent.twitchId = '';
        agent.currentGameId = '';
        agent.abilities = [];
        agent.bag = {
            weapons: [],
            books: [JSON.stringify(
                {
                    name: 'Test Book 1',
                    icon: "tome_azure.png",
                    abilities: [
                        {
                            weaponKillRequirements: {
                                sword: 1
                            },
                            ability: {
                                name: 'Big Bang',
                                damage: 50
                            }
                        },
                        {
                            weaponKillRequirements: {
                                staff: 1
                            },
                            ability: {
                                name: 'Super Blast',
                                damage: 70    
                            }
                        }
                    ]
                })
            ],
            items: [
                JSON.stringify({
                    name: 'potion',
                    count: 5
                }),
                JSON.stringify({
                    name: 'Phenix Down',
                    count: 5
                }),
            ]
        }
        agent.lastDrops = {
            weapons: []
        };
        agent.trackers = {
            weaponKills: {
                sword: 0,
                staff: 0
            }
        };
    }

    getData() {
        const newData = super.getData();
        newData.bag.weapons = chatRPGUtility.flattenObjectArray(newData.bag.weapons);
        newData.bag.books = chatRPGUtility.flattenObjectArray(newData.bag.books);
        newData.bag.items = chatRPGUtility.flattenObjectArray(newData.bag.items);
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

    findBookByName(name, flatten=true) {
        const book = this.datastoreObject.bag.books.find(element => element.name === name);

        if(!book) {
            return;
        }

        return flatten ? JSON.stringify(book) : book;
    }

    abilityRequirementMet(abilityBook, abilityIndex) {
        if(abilityIndex >= abilityBook.abilities.length) {
            return false;
        }

        const abilityEntry = abilityBook.abilities[abilityIndex];
        for(const requirement in abilityEntry.weaponKillRequirements) {
            if(this.datastoreObject.trackers.weaponKills[requirement] < abilityEntry.weaponKillRequirements[requirement]) {
                return false;
            }
        }

        return true;
    }

    dropBook(bookName) {
        const bookIndex = this.datastoreObject.bag.books.findIndex(element => element.name === bookName);

        if(bookIndex === -1) {
            return;
        }

        this.datastoreObject.bag.books.splice(bookIndex, 1);
    }

    findItemByName(itemName, flatten) {
        return Player.findItemByName(this.datastoreObject, itemName, flatten);
    }

    static findItemByName(datastoreObject, itemName, flatten) {
        return chatRPGUtility.findInObjectArray(datastoreObject.bag.items, 'name', itemName, flatten);
    }

    dropItem(itemName) {
        const itemIndex = this.datastoreObject.bag.items.findIndex(element => element.name === itemName);

        if(itemIndex === -1) {
            return;
        }

        this.datastoreObject.bag.items.splice(itemIndex, 1);
    }

    onItemUsed(item) {
        Player.onItemUsed(this.datastoreObject, item);
    }
    static onItemUsed(datastoreObject, item) {
        
        const itemIndex = datastoreObject.bag.items.findIndex(element => element.name === item.datastoreObject.name);
        if(itemIndex === -1) {
            return;
        }

        const thisItemData = datastoreObject.bag.items[itemIndex];
        Item.onUsed(thisItemData);

        if(!Item.isDepleted(thisItemData)) {
            return;
        }

        datastoreObject.bag.items.splice(itemIndex, 1);
    }

    mergeBattlePlayer(battlePlayer) {
        const thisPlayerData = this.datastoreObject;
        const battlePlayerData = battlePlayer.datastoreObject;

        thisPlayerData.maxHealth = battlePlayerData.maxHealth;
        thisPlayerData.health = battlePlayerData.health;
        thisPlayerData.attack = battlePlayerData.attack;
        thisPlayerData.magic =  battlePlayerData.magic;
        thisPlayerData.defence = battlePlayerData.defence;
        thisPlayerData.level = battlePlayerData.level;
        thisPlayerData.exp = battlePlayerData.exp;
        thisPlayerData.expToNextLevel = battlePlayerData.expToNextLevel;
        thisPlayerData.bag = battlePlayerData.bag;
    }

    OnMonsterDefeated() {
        this.datastoreObject.trackers.weaponKills[this.datastoreObject.weapon.type] += 1;
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
        monster.weaponDropRate = 0.5;
        monster.class = '';
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