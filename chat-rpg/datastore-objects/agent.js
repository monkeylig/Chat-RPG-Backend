const DatastoreObject = require('./datastore-object');
const chatRPGUtility = require('../utility');
const Item = require('./item');
const { Weapon } = require('./weapon');
const { InventoryPage } = require('./inventory-page');
const { gameColection } = require('./utilities');

/**
 * @typedef {import('./utilities').Collection} Collection
 * @typedef {import('./utilities').CollectionContainer} CollectionContainer
 * @typedef {import('./datastore-object').DatastoreConstructor} DatastoreConstructor
 * @typedef {import('./weapon').WeaponData} WeaponData
 */

/**
 * Calculates how much exp is needed to reach a level
 * @param {number} level 
 * @returns {number} The amount of exp needed to reach that level
 */
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
    player.defense += growthObject.defense;
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

/**
 * @typedef {Object} BagHolderData
 * @property {Object} bag
 * @property {Object} lastDrops
 * @property {number} coins
 */

/**
 * @template {DatastoreConstructor} TBase
 * @param {TBase} Base 
 * @returns 
 */
function BagHolderMixin(Base) {
    return class BagHolderObject extends Base {

        /**
         * 
         * @param  {...any} objectData 
         */
        constructor(...objectData) {
            super(...objectData);
        }

        constructNewObject(bagHolder) {
            super.constructNewObject(bagHolder);
            bagHolder.bag = {
                capacity: 10,
                objects: []
            };
            bagHolder.lastDrops = {
                objects: []
            };
            bagHolder.coins = 0;
        }
        /**
         * 
         * @param {Object} object 
         * @param {string} type 
         * @returns {CollectionContainer | undefined}
         */
        addObjectToBag(object, type) {
            const bag = this.datastoreObject.bag;
            return gameColection.addObjectToCollection(bag.objects, object, type, bag.capacity);
        }

        /**
         * 
         * @param {string} id 
         * @returns {CollectionContainer | undefined}
         */
        findObjectInBag(id) {
            return gameColection.findObjectInCollection(this.datastoreObject.bag.objects, id);
        }

        /**
         * 
         * @param {string} name 
         * @returns {CollectionContainer | undefined}
         */
        findObjectInBagByName(name) {
            for(const object of this.datastoreObject.bag.objects) {
                if(object.content.name === name) {
                    return object;
                }
            }
        }

        /**
         * 
         * @param {string} id 
         * @returns {CollectionContainer | undefined}
         */
        dropObjectFromBag(id) {
            return gameColection.dropObjectFromCollection(this.datastoreObject.bag.objects, id);
        }

        /**
         * 
         * @returns {boolean}
         */
        isBagFull() {
            return this.datastoreObject.bag.objects.length >= this.datastoreObject.bag.capacity;
        }

        addWeaponToBag(weapon) {
            return this.addObjectToBag(weapon.getData(), 'weapon');
        }

        addBookToBag(book) {
            return this.addObjectToBag(book, 'book');
        }

        addItemToBag(item) {
            return this.addObjectToBag(item.getData(), 'item');
        }

        addObjectToLastDrops(object, type) {
            const lastDrops = this.datastoreObject.lastDrops;
            return gameColection.addObjectToCollection(lastDrops.objects, object, type);
        }

        removeLastDrop(id) {
            return gameColection.dropObjectFromCollection(this.datastoreObject.lastDrops.objects, id);
        }

        clearLastDrops() {
            this.datastoreObject.lastDrops.objects = [];
        }

        onItemUsed(item) {
            const bag = this.datastoreObject.bag;
            const itemIndex = bag.objects.findIndex(element => element.content.name === item.getData().name);
            if(itemIndex === -1) {
                return;
            }

            const thisItemData = bag.objects[itemIndex].content;
            Item.onUsed(thisItemData);

            if(!Item.isDepleted(thisItemData)) {
                return;
            }

            bag.objects.splice(itemIndex, 1);
        }

        addCoins(coins) {
            this.datastoreObject.coins += coins;
        }

        /**
         * @param {string} weaponId 
         * @returns {boolean} If the opteration succeeded
         */
        equipWeaponFromBag(weaponId) {
            const weaponObject = this.findObjectInBag(weaponId);

            if(!weaponObject) {
                return false;
            }

            let equippedWeapon = this.datastoreObject.weapon;
            this.datastoreObject.weapon = weaponObject.content;
            this.dropObjectFromBag(weaponId);

            if(equippedWeapon && equippedWeapon.name !== chatRPGUtility.defaultWeapon.name) {
                this.addWeaponToBag(new Weapon(equippedWeapon));
            }

            return true;
        }
    };
}

/**
 * @typedef {Object} AgentData
 * @property {string} name
 * @property {string} avatar
 * @property {WeaponData} weapon
 * @property {Object[]} abilities
 * @property {number} autoRevive
 * @property {number} maxHealth
 * @property {number} health
 * @property {number} strength
 * @property {number} magic
 * @property {number} defense
 * @property {number} level
 * @property {number} exp
 * @property {number} expToNextLevel
 */

class Agent extends DatastoreObject {
    static MAXABILITIES = 5;
    constructor(objectData) {
        super(objectData);
    }

    constructNewObject(agent) {
        agent.name = 'Unknown';
        agent.avatar = 'unknown.png';
        agent.weapon = new Weapon(chatRPGUtility.defaultWeapon).getData();
        agent.abilities = [];
        agent.autoRevive = 0;
        agent.maxHealth = 0;
        agent.health = 0;
        agent.strength = 0;
        agent.magic = 0;
        agent.defense = 0;
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
        datastoreObject.defense = Math.floor(growthObject.defense * level);
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
        let healAmount = Math.min(hp, this.datastoreObject.maxHealth - this.datastoreObject.health);

        if (healAmount > 0) {
            healAmount = Math.max(healAmount, 1);
        }
        this.datastoreObject.health += Math.floor(healAmount);

        return healAmount;
    }

    findAbilityByName(name) {
        return chatRPGUtility.findInObjectArray(this.datastoreObject.abilities, 'name', name);
    }

    addAbility(abilityData) {
        this.datastoreObject.abilities.push(abilityData);
    }

    equipAbility(abilityData, replacedAbilityName)
    {
        const abilities = this.datastoreObject.abilities;

        if(replacedAbilityName) {
            const abilityIndex = abilities.findIndex(element => element.name === replacedAbilityName)

            if(abilityIndex === -1) {
                return;
            }

            abilities[abilityIndex] = abilityData;
        }
        else if (this.hasOpenAbilitySlot()) {
            this.addAbility(abilityData);
        }
    }
    
    removeAbility(abilityName) {
        const abilities = this.datastoreObject.abilities;
        const abilityIndex = abilities.findIndex(element => element.name === abilityName);
        
        if(abilityIndex === -1) {
            return;
        }

        const abilityData = abilities[abilityIndex];
        abilities.splice(abilityIndex, 1);

        return abilityData;
    }

    hasOpenAbilitySlot() {
        return this.datastoreObject.abilities.length < Agent.MAXABILITIES;
    }

    getUnflattenedData() {
        return this.datastoreObject;
    }

    revive(healPercent = 1) {
        Agent.revive(this.datastoreObject, healPercent);
    }

    static revive(datastoreObject, healPercent = 1) {
        if(Agent.isDefeated(datastoreObject)) {
            datastoreObject.health = Math.floor(datastoreObject.maxHealth * healPercent);
        }
    }
};


/**
 * A class representing a player
 * 
 */
class Player extends BagHolderMixin(Agent) {
    /**
     * @param {*} objectData 
     */
    constructor(objectData) {
        super(objectData);
    }

    constructNewObject(agent) {
        super.constructNewObject(agent);
        agent.twitchId = '';
        agent.currentGameId = '';
        agent.abilities = [];
        agent.inventory = {
            leger: []
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

    mergeBattlePlayer(battlePlayer) {
        const thisPlayerData = this.datastoreObject;
        const battlePlayerData = battlePlayer.datastoreObject;

        thisPlayerData.maxHealth = battlePlayerData.maxHealth;
        thisPlayerData.health = battlePlayerData.health;
        thisPlayerData.strength = battlePlayerData.strength;
        thisPlayerData.magic =  battlePlayerData.magic;
        thisPlayerData.defense = battlePlayerData.defense;
        thisPlayerData.level = battlePlayerData.level;
        thisPlayerData.exp = battlePlayerData.exp;
        thisPlayerData.expToNextLevel = battlePlayerData.expToNextLevel;
        thisPlayerData.bag.items = battlePlayerData.bag.items;
        thisPlayerData.autoRevive = battlePlayerData.autoRevive;
        thisPlayerData.bag = battlePlayerData.bag;
        thisPlayerData.coins = battlePlayerData.coins;
        thisPlayerData.lastDrops = battlePlayerData.lastDrops;

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

    getNextAvailableInventoryPageId() {
        const leger = this.datastoreObject.inventory.leger;
        // Has the inventory been created yet?
        if (leger.length === 0) {
            return;
        }

        for(const log of leger) {
            if (log.count < InventoryPage.PAGE_CAPACITY) {
                return log.id;
            }
        }
    }

    getInventoryPageLog(pageId) {
        return this.datastoreObject.inventory.leger.find(element => element.id === pageId);
    }

    onObjectAddedToInventory(pageId) {
        const leger = this.datastoreObject.inventory.leger;
        const pageIndex = leger.findIndex(element => element.id === pageId);

        if (pageIndex === -1) {
            leger.push({
                id: pageId,
                count: 1
            });
            return;
        }

        leger[pageIndex].count += 1;
    }

    onObjectRemovedFromInventory(pageId) {
        const leger = this.datastoreObject.inventory.leger;
        const pageIndex = leger.findIndex(element => element.id === pageId);

        if (pageIndex === -1) {
            return;
        }

        leger[pageIndex].count -= Math.min(1, leger[pageIndex].count);
    }
}

module.exports = {Agent, Player, BagHolderMixin};