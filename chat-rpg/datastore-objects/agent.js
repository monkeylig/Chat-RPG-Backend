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

function levelUpPlayer(player, growthObject) {
    player.maxHealth += growthObject.maxHealth + 1;
    player.health = player.maxHealth;
    player.strength += growthObject.strength;
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
    }

    constructNewObject(agent) {
        agent.name = 'Unknown';
        agent.avatar = 'unknown.png';
        agent.abilities = [];
        agent.weapon = {
            name: 'Fists',
            type: 'physical',
            style: 'melee',
            baseDamage: 10,
            speed: 3,
            icon: 'fist.png',
            strikeAbility: {
                name: 'Heavy Strike',
                baseDamage: 30
            },
            statGrowth: {
                maxHealth: 2,
                strength: 1,
                magic: 1,
                defence: 1
            }
        }

        agent.reviveReady = false;
        agent.maxHealth = 0;
        agent.health = 0;
        agent.strength = 0;
        agent.magic = 0;
        agent.defence = 0;
        agent.level = 0;
        agent.exp = 0;
        agent.expToNextLevel = 0;

        this.setStatsAtLevel(1);
    }

    setStatsAtLevel(level) {
        const player = this.datastoreObject;
        Agent.setStatsAtLevel(player, player.weapon.statGrowth, level)
    }

    static setStatsAtLevel(datastoreObject, growthObject, level) {
        datastoreObject.maxHealth = Math.floor(growthObject.maxHealth * level + 10 + level);
        datastoreObject.health = datastoreObject.maxHealth;
        datastoreObject.strength = Math.floor(growthObject.strength * level);
        datastoreObject.magic =  Math.floor(growthObject.magic * level);
        datastoreObject.defence = Math.floor(growthObject.defence * level);
        datastoreObject.level = level;
        datastoreObject.exp = 0;
        datastoreObject.expToNextLevel = getExpToNextLevel(datastoreObject.level);
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
        return Agent.isDefeated(this.datastoreObject);
    }

    static isDefeated(datastoreObject) {
        return datastoreObject.health <= 0;
    }

    heal(hp) {
        let healAmount = Math.floor(Math.min(hp, this.datastoreObject.maxHealth - this.datastoreObject.health));

        if (hp > 0) {
            healAmount = Math.max(healAmount, 1);
        }
        this.datastoreObject.health += healAmount;

        return healAmount;
    }

    findAbilityByName(name) {
        return chatRPGUtility.findInObjectArray(this.datastoreObject.abilities, 'name', name);
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

    getUnflattenedData() {
        return this.datastoreObject;
    }

    revive() {
        Agent.revive(this.datastoreObject);
    }

    static revive(datastoreObject) {
        if(Agent.isDefeated(datastoreObject)) {
            datastoreObject.health = Math.floor(datastoreObject.maxHealth * 0.75);
        }
    }
}

class Player extends Agent {
    static MAXWEAPONS = 10;
    constructor(objectData) {
        super(objectData);
    }

    constructNewObject(agent) {
        super.constructNewObject(agent);
        agent.twitchId = '';
        agent.currentGameId = '';
        agent.coins = 0;
        agent.abilities = [];
        agent.bag = {
            capacity: 20,
            weapons: [],
            books: [],
            items: []
        }
        agent.lastDrops = {
            weapons: []
        };
        agent.trackers = {
            weaponKills: {
                sword: 0,
                staff: 0,
                dagger: 0,
            },
            deaths: 0
        };
    }

    getUnflattenedData() {
        return this.datastoreObject;
    }

    addWeapon(weapon) {
        const weapons = this.datastoreObject.bag.weapons;
        if(weapons.length >= this.datastoreObject.bag.capacity) {
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

    findWeaponById(weaponId) {
        const weapon = this.datastoreObject.bag.weapons.find(element => element.id === weaponId);

        if(!weapon) {
            return;
        }

        return weapon;
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

    findBookByName(name) {
        const book = this.datastoreObject.bag.books.find(element => element.name === name);

        if(!book) {
            return;
        }

        return book;
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

    addBook(book) {
        if(this.datastoreObject.bag.books.length >= this.datastoreObject.bag.capacity) {
            return false;
        }

        const existingBookData = this.findBookByName(book.name);
        if(existingBookData) {
            return false;
        }

        this.datastoreObject.bag.books.push(book);
        return true;
    }

    dropBook(bookName) {
        const bookIndex = this.datastoreObject.bag.books.findIndex(element => element.name === bookName);

        if(bookIndex === -1) {
            return;
        }

        this.datastoreObject.bag.books.splice(bookIndex, 1);
    }

    addItem(item) {
        if(this.datastoreObject.bag.items.length >= this.datastoreObject.bag.capacity) {
            return false;
        }

        const existingItemData = this.findItemByName(item.getData().name);

        if(!existingItemData) {
            this.datastoreObject.bag.items.push(item.getData());
            return true;
        }

        existingItemData.count += item.getData().count;
        return true;
    }

    findItemByName(itemName) {
        return Player.findItemByName(this.datastoreObject, itemName);
    }

    static findItemByName(datastoreObject, itemName) {
        return chatRPGUtility.findInObjectArray(datastoreObject.bag.items, 'name', itemName);
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
        thisPlayerData.strength = battlePlayerData.strength;
        thisPlayerData.magic =  battlePlayerData.magic;
        thisPlayerData.defence = battlePlayerData.defence;
        thisPlayerData.level = battlePlayerData.level;
        thisPlayerData.exp = battlePlayerData.exp;
        thisPlayerData.expToNextLevel = battlePlayerData.expToNextLevel;
        thisPlayerData.bag.items = battlePlayerData.bag.items;
        thisPlayerData.reviveReady = battlePlayerData.reviveReady;

        this.revive();
    }

    onMonsterDefeated() {
        const style = this.datastoreObject.weapon.style;
        if (!this.datastoreObject.trackers.weaponKills[style]) {
            this.datastoreObject.trackers.weaponKills[style] = 0;
        }
        this.datastoreObject.trackers.weaponKills[style] += 1;
    }

    onPlayerDefeated() {
        this.datastoreObject.trackers.deaths += 1;
    }

    addCoins(coins) {
        this.datastoreObject.coins += coins;
    }
}

module.exports = {Agent, Player};