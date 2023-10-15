const DatastoreObject = require('./datastore-object');
const chatRPGUtility = require('../utility');
const utility = require("../../utility");
const Item = require('./item');
const { Weapon } = require('./weapon');
const { InventoryPage } = require('./inventory-page');

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

function addObjectToCollection(collection, object, type, limit) {
    if(limit && collection.length >= limit) {
        return;
    }

    const objectContainer = {
        type,
        id: utility.genId(),
        content: object
    };
    collection.push(objectContainer);
    return objectContainer;
}

function dropObjectFromCollection(collection, id) {
    const objectIndex = collection.findIndex(element => element.id === id);

    if(objectIndex === -1) {
        return;
    }

     const objectData = collection.splice(objectIndex, 1);

    return objectData[0];
}

function findObjectInCollection(collection, id) {
    const object = chatRPGUtility.findInObjectArray(collection, 'id', id);
    
    if (!object) {
        return;
    }
    return object;
}

const BagHolderMixin = {
    constructObject(bagHolder) {
        bagHolder.bag = {
            capacity: 10,
            objects: []
        };
        bagHolder.lastDrops = {
            objects: []
        };
        bagHolder.coins = 0;
    },

    addObjectToBag(object, type) {
        const bag = this.datastoreObject.bag;
        return addObjectToCollection(bag.objects, object, type, bag.capacity);
    },

    findObjectInBag(id) {
        return findObjectInCollection(this.datastoreObject.bag.objects, id);
    },

    findObjectInBagByName(name) {
        for(const object of this.datastoreObject.bag.objects) {
            if(object.content.name === name) {
                return object;
            }
        }
    },

    dropObjectFromBag(id) {
        return dropObjectFromCollection(this.datastoreObject.bag.objects, id);
    },

    isBagFull() {
        return this.datastoreObject.bag.objects.length >= this.datastoreObject.bag.capacity;
    },

    addWeaponToBag(weapon) {
        return this.addObjectToBag(weapon.getData(), 'weapon');
    },

    addBookToBag(book) {
        return this.addObjectToBag(book, 'book');
    },

    addItemToBag(item) {
        const existingItemData = this.findObjectInBagByName(item.getData().name);

        if(!existingItemData) {
            return this.addObjectToBag(item.getData(), 'item');
        }

        existingItemData.content.count += item.getData().count;
        return true;
    },

    addObjectToLastDrops(object, type) {
        const lastDrops = this.datastoreObject.lastDrops;
        return addObjectToCollection(lastDrops.objects, object, type);
    },

    removeLastDrop(id) {
        return dropObjectFromCollection(this.datastoreObject.lastDrops.objects, id);
    },

    clearLastDrops() {
        this.datastoreObject.lastDrops.objects = [];
    },

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
    },

    addCoins(coins) {
        this.datastoreObject.coins += coins;
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
        agent.weapon = new Weapon(chatRPGUtility.defaultWeapon).getData();
        agent.autoRevive = 0;
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

    revive(healPercent = 1) {
        Agent.revive(this.datastoreObject, healPercent);
    }

    static revive(datastoreObject, healPercent = 1) {
        if(Agent.isDefeated(datastoreObject)) {
            datastoreObject.health = Math.floor(datastoreObject.maxHealth * healPercent);
        }
    }
}

class Player extends Agent {
    constructor(objectData) {
        super(objectData);
    }

    constructNewObject(agent) {
        super.constructNewObject(agent);
        BagHolderMixin.constructObject(agent);
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
        if (!leger.length === 0) {
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

Object.assign(Player.prototype, BagHolderMixin);

module.exports = {Agent, Player, BagHolderMixin};