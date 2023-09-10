const { BattlePlayer, BattleMonster } = require('../datastore-objects/battle-agent');
const monsterAi = require('../monster-ai/monster-ai')
const BattleSteps = require('../battle-steps');
const AbilityFunctions = require('../equippable-functions/ability-functions');
const ItemFunctions = require('../equippable-functions/item-functions');
const chatRPGUtility = require('../utility');
const { BattleWeapon } = require('../datastore-objects/weapon');
const Ability = require('../datastore-objects/ability');
const ChatRPGErrors = require('../errors');
const Item = require('../datastore-objects/item');

const ESCAPE_PRIORITY = 100000;
const ITEM_PRIORITY = 10000;
const LOW_LEVEL_COIN_DROP_RATE = 0.3;

function singlePlayerBattleIteration(battle, playerActionRequest) {
    if (battle.active === false) {
        return;
    }
    const battlePlayer = new BattlePlayer(battle.player);
    const battleMonster = new BattleMonster(battle.monster);
    const monsterActionRequest = monsterAi.genericAi(battleMonster, battlePlayer, battle);

    //Proccess battle actions
    //player action
    const playerAction = createBattleAction(playerActionRequest, battlePlayer);
    //monster action
    const monsterAction = createBattleAction(monsterActionRequest, battleMonster);

    const steps = [];
    steps.push(...executeActionPhase(battlePlayer, playerAction, battleMonster, monsterAction, battle));

    battle.player = battlePlayer.getData();
    battle.monster = battleMonster.getData();
    battle.round += 1;

    return steps;
}

function executeActionPhase(battlePlayer, battlePlayerAction, battleMonster, battleMonsterAction, battle) {

    let firstAction;
    let firstPlayer;
    let secondAction;
    let secondPlayer;

    if(battlePlayerAction.speed >= battleMonsterAction.speed) {
        firstAction = battlePlayerAction;
        firstPlayer = battlePlayer;
        secondAction = battleMonsterAction;
        secondPlayer = battleMonster;
    }
    else {
        firstAction = battleMonsterAction;
        firstPlayer = battleMonster;
        secondAction = battlePlayerAction;
        secondPlayer = battlePlayer;
    }

    const checkRevive = (player) => {
        if(!player.isDefeated() || !player.getData().reviveReady) {
            return false;
        }

        steps.push(BattleSteps.revive(player));
        player.getData().reviveReady = false;
        return true
    };

    const steps = [];
    steps.push(...applyAction(firstAction, firstPlayer, secondPlayer, battle));

    checkRevive(battlePlayer);
    checkRevive(battleMonster);
    let endStep = checkEndOfBattleSteps(battlePlayer, battleMonster, battle);
    if(endStep) {
        steps.push(endStep);
        return steps;
    }

    steps.push(...applyAction(secondAction, secondPlayer, firstPlayer, battle));

    checkRevive(battlePlayer);
    checkRevive(battleMonster);
    endStep = checkEndOfBattleSteps(battlePlayer, battleMonster, battle);
    if(endStep) {
        steps.push(endStep);
    }

    return steps;
}

function checkEndOfBattleSteps(battlePlayer, battleMonster, battle) {

    if(!battle.active && battle.result.status === 'escape') {
        return {
            type: "battle_end",
            description: `${battle.player.name} escaped.`
        };
    }

    if(!battlePlayer.isDefeated() && !battleMonster.isDefeated()) {
        return;
    }

    battle.active = false;
    battle.result = {};
    const result = battle.result;

    if(battlePlayer.isDefeated() && battleMonster.isDefeated()) {
        result.winner = null;
        result.status = 'draw';
        return BattleSteps.battleEnd("The battle ended in a draw.");
    }
    else if(battlePlayer.isDefeated()) {
        result.winner = battleMonster.getData().id;
        result.status = 'defeat';
        return BattleSteps.battleEnd(`${battlePlayer.getData().name} was defeated.`);
    }
    else if(battleMonster.isDefeated()) {
        result.status = 'victory';
        const expGain = battleMonster.getExpGain();
        battlePlayer.addExpAndLevel(expGain);

        result.winner = battlePlayer.getData().id;
        result.expAward = expGain;
        result.drops = [];

        // Compute the monster drops
        const willDropWeapon = chatRPGUtility.chance(battleMonster.getData().weaponDropRate)/* && !player.hasWeapon(monsterData.weapon)*/; //To Do: Need to have the player bring bag into battle

        if(willDropWeapon) {
            const drop = {
                type: 'weapon',
                content: battleMonster.getData().weapon,
                bagFull: false
            };

            /*if(!player.addWeapon(monsterData.weapon)) { //To Do: Need to have the player bring bag into battle
                drop.bagFull = true;
                lastDrop.weapons.push(monsterData.weapon);
            }*/
            result.drops.push(drop);
        }

        let shouldDropCoin = battle.player.level <= battleMonster.getData().level || chatRPGUtility.chance(LOW_LEVEL_COIN_DROP_RATE);
        if(battleMonster.getData().coinDrop > 0 && shouldDropCoin) {
            const drop = {
                type: 'coin',
                content: {
                    name: `${battleMonster.getData().coinDrop} coins`,
                    icon: 'coin.png'
                }
            };
            //player.addCoins(battleMonster.getData().coinDrop);
            result.drops.push(drop);
        }

        battle.result = result;
        return BattleSteps.battleEnd(`${battleMonster.getData().name} was defeated!`);
    }
}

function applyAction(battleAction, srcPlayer, targetPlayer, battle) {
    const steps = [];
    // Damage step
    if(battleAction.type === 'strike') {
        
        if(srcPlayer.strikeAbilityReady()) {
            srcPlayer.getData().strikeLevel = 0;
            const strikeAbility = new Ability(srcPlayer.getData().weapon.strikeAbility);
            const abilitySteps = createAbilitySteps(strikeAbility, srcPlayer, targetPlayer, battle);
            steps.push(...abilitySteps);
            srcPlayer.onStrikeAbility();
        }
        else {
            const infoStep = BattleSteps.info(`${srcPlayer.getData().name} strikes ${targetPlayer.getData().name}!`, 'strike', srcPlayer.getData().id, targetPlayer.getData().id, chatRPGUtility.strikeAnim);
            const damageStep = BattleSteps.damage(srcPlayer, targetPlayer, srcPlayer.getData().weapon.baseDamage + srcPlayer.consumeEmpowermentValue(srcPlayer.getData().weapon.type), srcPlayer.getData().weapon.type);
            steps.push(infoStep);
            steps.push(damageStep);
            srcPlayer.onStrike();
        }

    }

    else if(battleAction.type === 'ability') {
        steps.push(...createAbilitySteps(battleAction.ability, srcPlayer, targetPlayer, battle));
        steps.push(BattleSteps.apCost(srcPlayer, battleAction.ability.getData().apCost))
        srcPlayer.onAbilityUsed(battleAction.ability);
    }

    else if(battleAction.type === 'item') {
        const itemData = battleAction.item.datastoreObject;
        const infoStep = BattleSteps.info(`${srcPlayer.getData().name} used ${itemData.name}!`, 'item', srcPlayer.getData().id);
        if(ItemFunctions.isItemReady(itemData, battle, srcPlayer, targetPlayer)) {
            const standardSteps = ItemFunctions.standardBattleSteps(itemData, srcPlayer, targetPlayer);
            const itemSteps = ItemFunctions.effectBattleSteps(itemData, battle, srcPlayer, targetPlayer, {});
            srcPlayer.onItemUsed(battleAction.item);

            steps.push(infoStep);
            if(standardSteps) {
                steps.push(...standardSteps);
            }
            if(itemSteps) {
                steps.push(...itemSteps);
            }
        }
        else {
            const readyInfoStep = BattleSteps.info(ItemFunctions.getNotReadyMessage(itemData), 'item failed', srcPlayer.getData().id);
            steps.push(readyInfoStep);
        }
    }

    else if(battleAction.type === 'escape') {
        battle.active = false;
        battle.result = {
            status: 'escape',
            winner: null
        };
    }

    return steps;
}

function createAbilitySteps(ability, srcPlayer, targetPlayer, battle, isStrikeAbility) {
    const steps = [];
    const infoStep = BattleSteps.info(`${srcPlayer.getData().name} used ${ability.getData().name}!`, 'ability', srcPlayer.getData().id, targetPlayer.getData().id, ability.getData().animation);
    const standardSteps = AbilityFunctions.standardSteps(ability, battle, srcPlayer, targetPlayer, isStrikeAbility);
    const abilitySteps = AbilityFunctions.effectSteps(ability, battle, srcPlayer, targetPlayer, {});

    steps.push(infoStep);
    if(standardSteps) {
        steps.push(...standardSteps);
    }
    if(abilitySteps) {
        steps.push(...abilitySteps);
    }
    return steps;
}

function createBattleAction(actionRequest, battlePlayer) {
    const playerData = battlePlayer.datastoreObject;
    let playerBattleAction;
    if(actionRequest.type === 'strike') {
        const weapon = new BattleWeapon(playerData.weapon);
        playerBattleAction = {
            type: 'strike',
            speed: weapon.getModifiedSpeed()
        }
    }
    else if(actionRequest.type === 'escape') {
        playerBattleAction = {
            type: 'escape',
            speed: ESCAPE_PRIORITY
        }
    }

    else if(actionRequest.type === 'ability') {
        const abilityData = battlePlayer.findAbilityByName(actionRequest.abilityName);
        if(!abilityData) {
            throw new Error(ChatRPGErrors.abilityNotEquipped);
        }
        const ability = new Ability(abilityData);

        if(playerData.ap < ability.getData().apCost) {
            throw new Error(ChatRPGErrors.notEnoughAp);
        }

        playerBattleAction = {
            type: 'ability',
            ability: ability,
            speed: ability.getData().speed
        }
    }

    else if(actionRequest.type === 'item') {
        const itemData = battlePlayer.findItemByName(actionRequest.itemName);
        if(!itemData) {
            throw new Error(ChatRPGErrors.itemNotEquipped);
        }
        const item = new Item(itemData);

        playerBattleAction = {
            type: 'item',
            item: item,
            speed: ITEM_PRIORITY
        }

    }

    return playerBattleAction;
}

module.exports = {
    singlePlayerBattleIteration
}