/**
 * @import {ItemData} from './item'
 * @import {EffectData} from '../battle-system/effect'
 * @import {CollectionContainer, Collection} from './utilities'
 * @import {DatastoreConstructor} from './datastore-object'
 * @import {WeaponData} from './weapon'
 * @import {AbilityData} from './ability'
 * @import {BattlePlayer} from './battle-agent'
 */

const DatastoreObject = require('./datastore-object');
const chatRPGUtility = require('../utility');
const Item = require('./item');
const { Weapon } = require('./weapon');
const { InventoryPage } = require('./inventory-page');
const { gameColection } = require('./utilities');
const { calcAgentGrowth, EXP_LEVEL_CAP } = require('../battle-system/utility');
const { FieldValue } = require('../../data-source/backend-data-source');

/**
 * 
 * @typedef {Object} BagHolderData
 * @property {Object} bag
 * @property {{
 * objects: Collection[]
 * }} lastDrops
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

        /**
         * 
         * @param {Weapon} weapon 
         * @returns {CollectionContainer | undefined}
         */
        addWeaponToBag(weapon) {
            return this.addObjectToBag(weapon.getData(), 'weapon');
        }

        addBookToBag(book) {
            return this.addObjectToBag(book, 'book');
        }

        /**
         * 
         * @param {Item} item 
         * @returns {CollectionContainer | undefined}
         */
        addItemToBag(item) {
            return this.addObjectToBag(item.getData(), 'item');
        }

        /**
         * 
         * @param {object} object 
         * @param {string} type 
         * @returns 
         */
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

        /**
         * 
         * @param {Item} item 
         * @returns {ItemData | undefined}
         */
        onItemUsed(item) {
            const bag = this.datastoreObject.bag;
            const itemIndex = bag.objects.findIndex(element => element.content.name === item.getData().name);
            if(itemIndex === -1) {
                return;
            }

            const thisItemData = bag.objects[itemIndex].content;
            Item.onUsed(thisItemData);

            if(!Item.isDepleted(thisItemData)) {
                return thisItemData;
            }

            bag.objects.splice(itemIndex, 1);
            return thisItemData;
        }

        /**
         * 
         * @param {string} name 
         * @returns {Item | undefined}
         */
        consumeItem(name) {
            const bag = this.datastoreObject.bag;
            const itemIndex = bag.objects.findIndex(element => element.content.name === name);
            if(itemIndex === -1) {
                return;
            }

            const thisItem = new Item(bag.objects[itemIndex].content);
            thisItem.onUsed();

            if(!thisItem.isDepleted()) {
                bag.objects[itemIndex].content = thisItem.getData();
                return thisItem;
            }

            bag.objects.splice(itemIndex, 1);
            return thisItem;
        }

        /**
         * 
         * @param {number} coins
         * @returns {void} 
         */
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
 * @property {AbilityData[]} abilities
 * @property {number} autoRevive
 * @property {number} maxHealth
 * @property {number} health
 * @property {number} strength
 * @property {number} magic
 * @property {number} defense
 * @property {number} level
 * @property {number} exp
 * @property {number} expToNextLevel
 * @property {Object.<string, EffectData>} effectsMap
 * @property {any} created
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
        agent.maxHealth = 12;
        agent.health = 12;
        agent.strength = 1;
        agent.magic = 1;
        agent.defense = 1;
        agent.level = 0;
        agent.exp = 0;
        agent.expToNextLevel = 0;
        agent.effectsMap = {};
        agent.created = FieldValue.Timestamp


        this.setStatsAtLevel(1);
    }

    /**
     * @override
     * @returns {AgentData}
     */
    getData() {
        return /** @type {AgentData} */ (this.datastoreObject);
    }

    setStatsAtLevel(level) {
        Agent.setStatsAtLevel(this.getData(), level)
    }

    /**
     * @param {AgentData} agentData 
     * @param {number} level 
     * @param {{
     * maxHealth: number,
     * strength: number,
     * magic: number,
     * defense: number}} [overrideGrowthObject] 
     */
    static setStatsAtLevel(agentData, level, overrideGrowthObject) {
        const pointsChanged = calcAgentGrowth(level, agentData.level);

        const growthObject = overrideGrowthObject ? overrideGrowthObject : {
            maxHealth: 1,
            strength: 1,
            magic: 1,
            defense: 1
        };

        /**@type {(arg0: string) => string} */
        const typeToStat = (type) => {
            if (type === 'physical') {
                return 'strength';
            }
            else if (type === 'magical') {
                return 'magic'
            }

            return 'maxHealth';
        };

        /**@type {(abilityData: AbilityData, stat: string) => boolean} */
        const hasAbilityStat = (abilityData, stat) => {
            if (abilityData[stat]) {
                return true;
            }

            if (abilityData.postActions) {
                for (const action of abilityData.postActions) {
                    if (action[stat]) {
                        return true;
                    }
                }
            }

            return false;
        }

        /**@type {(abilityData: AbilityData, multiplier?: number) => void} */
        const addAbilityGrowth = (abilityData, multiplier = 1) => {
            let elements = [];
            if (abilityData.elements) {
                elements = abilityData.elements;
            }

            if (abilityData.type) {
                if (abilityData.baseDamage && abilityData.baseDamage >= 50) {
                    growthObject[typeToStat(abilityData.type)] += multiplier;
                }
            }

            if (hasAbilityStat(abilityData, 'protection')) {
                growthObject.maxHealth += multiplier;
                growthObject.defense += multiplier;
            }

            if (hasAbilityStat(abilityData, 'heal') ||
                hasAbilityStat(abilityData, 'healPercent') ||
                hasAbilityStat(abilityData, 'absorb') ||
                hasAbilityStat(abilityData, 'revive')
            )
            {
                growthObject.maxHealth += multiplier;
            }

            if (hasAbilityStat(abilityData, 'defenseAmp') ||
                hasAbilityStat(abilityData, 'lightningResistAmp') ||
                hasAbilityStat(abilityData, 'fireResistAmp') ||
                hasAbilityStat(abilityData, 'waterResistAmp') ||
                hasAbilityStat(abilityData, 'recoil')
            ) {
                growthObject.defense += multiplier;
            }
        }

        if (!overrideGrowthObject) {
            // Weapon calibration
            addAbilityGrowth(agentData.weapon.strikeAbility);
            
            // Ability calibration
            for (const abilityData of agentData.abilities) {
                addAbilityGrowth(abilityData);
            }
        }

        //Distribute points
        const growthTotal = growthObject.defense + growthObject.magic + growthObject.maxHealth + growthObject.strength;

        const levelUpReport = {
            maxHealth: growthObject.maxHealth/growthTotal * pointsChanged,
            strength: growthObject.strength/growthTotal * pointsChanged,
            magic: growthObject.magic/growthTotal * pointsChanged,
            defense: growthObject.defense/growthTotal * pointsChanged
        };

        agentData.maxHealth += levelUpReport.maxHealth;
        agentData.health = agentData.maxHealth;
        agentData.strength += levelUpReport.strength;
        agentData.magic += levelUpReport.magic;
        agentData.defense += levelUpReport.defense;
        agentData.level = level;
        agentData.exp = 0;
        agentData.expToNextLevel = this.getExpToNextLevel(agentData.level);

        return levelUpReport;
    }

    levelUp() {
        this.setStatsAtLevel(this.getData().level + 1);
    }

    /**
     * 
     * @param {number} level 
     */
    static expEquation(level) {
        return Math.floor(level**3 * 5/4);
    }
    /**
     * Calculates how much exp is needed to reach a level
     * @param {number} level 
     * @returns {number} The amount of exp needed to reach that level
     */
    static expFunc(level) {
        if (level <= 1) {
            return 0;
        }

        if (level > EXP_LEVEL_CAP) {
            const expCap = this.expEquation(EXP_LEVEL_CAP);
            return expCap + (level - EXP_LEVEL_CAP) * (expCap - this.expEquation(EXP_LEVEL_CAP - 1));
        }
        return this.expEquation(level);
    }

    /**
     * 
     * @param {number} level 
     * @returns {number}
     */
    static getExpToNextLevel(level) {
        return this.expFunc(level + 1) - this.expFunc(level);
    }

    /**
     * 
     * @param {number} exp 
     */
    addExpAndLevel(exp) {
        let _exp = exp
        const player = this.getData();

        while (_exp > 0) {
            let expToAdd = Math.min(_exp, player.expToNextLevel - player.exp);
            player.exp += expToAdd;
            _exp -= expToAdd;

            if(player.exp >= player.expToNextLevel) {
                this.levelUp();
            }
        }
    }

    isDefeated() {
        return Agent.isDefeated(this.datastoreObject);
    }

    static isDefeated(datastoreObject) {
        return datastoreObject.health <= 0;
    }

    /**
     * 
     * @param {number} hp 
     * @returns {number}
     */
    heal(hp) {
        if (this.isDefeated()) {
            return 0;
        }

        let healAmount = Math.min(hp, this.datastoreObject.maxHealth - this.datastoreObject.health);

        healAmount = Math.max(healAmount, 0);
        this.datastoreObject.health += healAmount;

        return healAmount;
    }

    findAbilityByName(name) {
        return chatRPGUtility.findInObjectArray(this.datastoreObject.abilities, 'name', name);
    }

    /**
     * 
     * @param {AbilityData} abilityData
     * @returns {boolean} 
     */
    addAbility(abilityData) {
        const datastoreObject = this.getData();
        if (datastoreObject.abilities.find((ability) => ability.name === abilityData.name)) {
            return false;
        }
        this.datastoreObject.abilities.push(abilityData);
        return true;
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
    
    /**
     * 
     * @param {string} abilityName 
     * @returns {AbilityData | undefined}
     */
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

    /**
     * 
     * @param {number} healPercent 
     * @returns {number}
     */
    revive(healPercent = 1) {
        return Agent.revive(this.datastoreObject, healPercent);
    }

    static revive(datastoreObject, healPercent = 1) {
        if(!Agent.isDefeated(datastoreObject)) {
            return 0;
        }

        const healAmount = datastoreObject.maxHealth * healPercent;
        datastoreObject.health = healAmount;
        return healAmount;
    }

    /**
     * 
     * @param {EffectData} effectData 
     */
    setEffect(effectData) {
        if (effectData.persistentId) {
            this.getData().effectsMap[effectData.persistentId] = effectData;
        }
    }

    /**
     * 
     * @param {string} id
     * @returns {EffectData | undefined} 
     */
    getEffect(id) {
        return this.getData().effectsMap[id];
    }

    /**
     * 
     * @param {string} id 
     */
    removeEffect(id) {
        delete this.getData().effectsMap[id];
    }
};

/**
 * @typedef {AgentData & BagHolderData & {
 * currentGameId: string,
 * twitchId: string,
 * inventory: object,
 * trackers: object
 * }} PlayerData
 */

/**
 * A class representing a player 
 */
class Player extends BagHolderMixin(Agent) {
    /**
     * @param {*} [objectData] 
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

    /**
     * @override
     * @returns {PlayerData}
     */
    getData() {
        return /** @type {PlayerData} */ (this.datastoreObject);
    }

    /**
     * 
     * @param {BattlePlayer} battlePlayer 
     */
    mergeBattlePlayer(battlePlayer) {
        const thisPlayerData = this.getData();
        const battlePlayerData = battlePlayer.getData();

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
        thisPlayerData.effectsMap = battlePlayerData.effectsMap;

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