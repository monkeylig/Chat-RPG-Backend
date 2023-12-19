const { BattlePlayer, BattleMonster, BattleWeapon } = require('../datastore-objects/battle-agent');
const monsterAi = require('../monster-ai/monster-ai')
const BattleSteps = require('../battle-steps');
const AbilityFunctions = require('../equippable-functions/ability-functions');
const ItemFunctions = require('../equippable-functions/item-functions');
const chatRPGUtility = require('../utility');
const Ability = require('../datastore-objects/ability');
const ChatRPGErrors = require('../errors');
const Item = require('../datastore-objects/item');
const { Weapon } = require('../datastore-objects/weapon');
const { Book } = require('../datastore-objects/book');
const gameplayObjects = require('../gameplay-objects');

const ESCAPE_PRIORITY = 100000;
const ITEM_PRIORITY = 10000;
const COUNTER_PRIORITY = 1000;
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

    // Post Action Phase
    steps.push(...executePostActionPhase(battlePlayer, battleMonster, battle));

    const endSteps = checkEndOfBattleSteps(battlePlayer, battleMonster, battle);

    steps.push(...endSteps);

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

    const steps = [];

    steps.push(...applyAction(firstAction, firstPlayer, secondPlayer, battle));
    steps.push(...applyAction(secondAction, secondPlayer, firstPlayer, battle));

    firstPlayer.clearCounter();
    secondPlayer.clearCounter();

    return steps;
}

function executePostActionPhase(battlePlayer, battleMonster, battle) {
    const steps = [];
    if(!battle.active) {
        return steps;
    }
    
    steps.push(...checkInflame(battleMonster));
    steps.push(...checkInflame(battlePlayer));

    steps.push(...checkSurged(battleMonster));
    steps.push(...checkSurged(battlePlayer));
    
    steps.push(...checkDrenched(battleMonster));
    steps.push(...checkDrenched(battlePlayer));

    steps.push(...checkFrozen(battleMonster));
    steps.push(...checkFrozen(battlePlayer));

    return steps;
}

function checkInflame(battleAgent) {
    if(battleAgent.isDefeated()) {
        return [];
    }

    const inflamed = battleAgent.getStatusEffect(gameplayObjects.statusEffects.inflamed.name);
    if(!inflamed) {
        return [];
    }

    const steps = [];
    const defensiveRatio = battleAgent.getData().defense / battleAgent.getModifiedDefense();
    const inflameDamage = battleAgent.getData().maxHealth * inflamed.damagePercentage;

    steps.push(BattleSteps.damage(battleAgent, Math.max(1, inflameDamage * defensiveRatio)));
    steps.push(BattleSteps.info(`${battleAgent.getData().name} was hurt from being inflamed.`, 'inflameDamage'));

    const tickStep = tickStatusEffectStep(battleAgent, inflamed);
    if(tickStep) {
        steps.push(tickStep);
    }

    const reviveStep = createReviveStep(battleAgent);
    if(reviveStep) {
        steps.push(reviveStep);
    }
    return steps;
}

function checkSurged(battleAgent) {
    if(battleAgent.isDefeated()) {
        return [];
    }

    const surged = battleAgent.getStatusEffect(gameplayObjects.statusEffects.surged.name);
    if(!surged) {
        return [];
    }

    const steps = [];

    const tickStep = tickStatusEffectStep(battleAgent, surged);
    if(tickStep) {
        steps.push(tickStep);
    }

    return steps;
}

function checkDrenched(battleAgent) {
    if(battleAgent.isDefeated()) {
        return [];
    }

    const drenched = battleAgent.getStatusEffect(gameplayObjects.statusEffects.drenched.name);
    if(!drenched) {
        return [];
    }

    const steps = [];
    const tickStep = tickStatusEffectStep(battleAgent, drenched);
    if(tickStep) {
        steps.push(tickStep);
    }

    return steps;
}

function checkFrozen(battleAgent) {
    if(battleAgent.isDefeated()) {
        return [];
    }

    const frozen = battleAgent.getStatusEffect(gameplayObjects.statusEffects.frozen.name);
    if(!frozen) {
        return [];
    }

    const steps = [];
    const tickStep = tickStatusEffectStep(battleAgent, frozen);
    if(tickStep) {
        steps.push(tickStep);
    }

    return steps;
}

function popSurged(battleAgent) {
    const surged = battleAgent.getStatusEffect(gameplayObjects.statusEffects.surged.name);
    if(!surged) {
        return [];
    }

    const defensiveRatio = battleAgent.getData().defense / battleAgent.getModifiedDefense();
    const surgeDamage = battleAgent.getData().maxHealth * surged.damagePercentage;

    const steps = [
        BattleSteps.damage(battleAgent, Math.min(1, surgeDamage * defensiveRatio)),
        BattleSteps.info(`${battleAgent.getData().name} was discharged!`, 'surchedPop', undefined, battleAgent.getData().id),
        BattleSteps.removeStatusEffect(gameplayObjects.statusEffects.surged, battleAgent)
    ];


    return steps;
}

function tickStatusEffectStep(battleAgent, statusEffect) {

    statusEffect.roundsLeft -= 1;
    if(statusEffect.roundsLeft <= 0) {
        return BattleSteps.removeStatusEffect(statusEffect, battleAgent);
    }
}

function checkEndOfBattleSteps(battlePlayer, battleMonster, battle) {

    if(!battle.active && battle.result.status === 'escape') {
        return [BattleSteps.battleEnd()];
    }

    if(!battlePlayer.isDefeated() && !battleMonster.isDefeated()) {
        return [];
    }

    battle.active = false;
    battle.result = {};
    const result = battle.result;

    if(battlePlayer.isDefeated() && battleMonster.isDefeated()) {
        result.winner = null;
        result.status = 'draw';
        return [
            BattleSteps.info("The battle ended in a draw."),
            BattleSteps.battleEnd()
        ];
    }
    else if(battlePlayer.isDefeated()) {
        result.winner = battleMonster.getData().id;
        result.status = 'defeat';
        return [
            BattleSteps.info(`${battlePlayer.getData().name} was defeated.`),
            BattleSteps.battleEnd()
        ];
    }
    else if(battleMonster.isDefeated()) {
        result.status = 'victory';
        const expGain = battleMonster.getExpGain();
        const oldLevel = battlePlayer.getData().level;
        battlePlayer.addExpAndLevel(expGain);

        result.winner = battlePlayer.getData().id;
        result.expAward = expGain;
        result.levelGain = battlePlayer.getData().level - oldLevel;
        result.drops = [];
        battlePlayer.clearLastDrops();

        // Compute the monster drops
        const willDropWeapon = chatRPGUtility.chance(battleMonster.getData().weaponDropRate);

        if(willDropWeapon) {
            const monsterWeapon = new Weapon(battleMonster.getData().weapon);
            const drop = {
                type: 'weapon',
                content: monsterWeapon.getData(),
                bagFull: false
            };

            if(!battlePlayer.addWeaponToBag(monsterWeapon)) {
                drop.bagFull = true;
                battlePlayer.addObjectToLastDrops(monsterWeapon.getData(), 'weapon');
            }
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
            battlePlayer.addCoins(battleMonster.getData().coinDrop);
            result.drops.push(drop);
        }

        battle.result = result;
        battle.player = battlePlayer.getData();
        battle.monster = battleMonster.getData();

        for(const bagItem of battlePlayer.getData().bag.objects) {
            if(bagItem.type !== 'book') {
                continue;
            }

            const unlockedAbilities = Book.updateAbilityRequirements(bagItem.content, battlePlayer, battle);

            if(unlockedAbilities.length > 0) {
                const drop = {
                    type: 'abilitiesUnlock',
                    content: {
                        name: `${bagItem.content.name} ability unlocked!`
                    },
                    description: `Abilities unlocked from ${bagItem.content.name}!`
                };

                result.drops.push(drop);
            }
        }
        return [
            BattleSteps.info(`${battleMonster.getData().name} was defeated!`),
            BattleSteps.battleEnd()
        ];
    }
}

function applyAction(battleAction, srcPlayer, targetPlayer, battle) {
    if(srcPlayer.isDefeated() || targetPlayer.isDefeated() || !battle.active) {
        return [];
    }
    const steps = [];

    if(battleAction.type === 'strike' || battleAction.type === 'ability') {
        if(srcPlayer.getStatusEffect(gameplayObjects.statusEffects.frozen.name) && chatRPGUtility.chance(gameplayObjects.statusEffects.frozen.attackChance)) {
            steps.push(BattleSteps.info(`${srcPlayer.getData().name} is frozen and can't attack.`, 'frozen attack', '', srcPlayer.getData().id));
            return steps;
        }
    }

    // Damage step
    if(battleAction.type === 'strike') {
        
        if(srcPlayer.strikeAbilityReady()) {
            srcPlayer.getData().strikeLevel = 0;
            const weapon = new BattleWeapon(srcPlayer.getData().weapon);
            const elements = weapon.getImbuedElements();
            const strikeAbility = new Ability(srcPlayer.getData().weapon.strikeAbility);
            strikeAbility.getData().elements.push(...elements);
            const abilitySteps = createAbilitySteps(strikeAbility, srcPlayer, targetPlayer, battle);
            steps.push(...abilitySteps); 
            srcPlayer.onStrikeAbility();

            for(const element of elements) {
                if(weapon.getData().imbuements[element].durationCondition === 'strikeAbility') {
                    steps.push(BattleSteps.removeImbue(srcPlayer, element));
                }
            }
        }
        else {
            const counter = targetPlayer.getCounter('strike');
            steps.push(BattleSteps.info(`${srcPlayer.getData().name} strikes ${targetPlayer.getData().name}!`, 'strike', srcPlayer.getData().id, targetPlayer.getData().id, counter ? null : chatRPGUtility.strikeAnim));
            if(counter) {
                targetPlayer.clearCounter();
                steps.push(BattleSteps.info(`But it was countered!`))
                steps.push(...createAbilitySteps(new Ability(counter.ability), targetPlayer, srcPlayer, battle));
            }
            else {
                steps.push(...BattleSteps.genStrikeSteps(srcPlayer, targetPlayer));

                const abilityStrikes = srcPlayer.getAbilityStrikes();
                const abilitiesToRemove = [];

                abilityStrikes.forEach((abilityStrike, index) => {
                    const target = abilityStrike.ability.target === 'self' ? srcPlayer : targetPlayer
                    steps.push(BattleSteps.info('', 'abilityStrike', srcPlayer.getData().id, target.getData().id, abilityStrike.ability.animation));
                    steps.push(...activateAbility(new Ability(abilityStrike.ability), srcPlayer, targetPlayer, battle));

                    if(abilityStrike.durationCondition && abilityStrike.durationCondition.type === 'strikes') {
                        abilityStrike.durationCondition.value -= 1;
                        if(abilityStrike.durationCondition.value <= 0) {
                            abilitiesToRemove.push(index);
                        }
                    }
                });

                abilitiesToRemove.forEach(abilityIndex => {
                    srcPlayer.removeAbilityStrike(abilityIndex);
                });
            }
            srcPlayer.onStrike();
        }

    }

    else if(battleAction.type === 'ability') {
        const ability = battleAction.ability;
        steps.push(...createAbilitySteps(ability, srcPlayer, targetPlayer, battle));
        if(ability.getData().charges !== null) {
            ability.getData().charges -= 1;
            if(ability.getData().charges <= 0) {
                steps.push(BattleSteps.removeAbility(srcPlayer, ability.getData().name));
            }
        }

        steps.push(BattleSteps.apCost(srcPlayer, battleAction.ability.getData().apCost));
        steps.push(...popSurged(srcPlayer));
        srcPlayer.onAbilityUsed(battleAction.ability);
    }

    else if(battleAction.type === 'item') {
        const item = battleAction.item;
        const itemData = item.getData();
        const infoStep = BattleSteps.info(`${srcPlayer.getData().name} used a ${item.getData().name}!`, 'item', srcPlayer.getData().id);
        if(ItemFunctions.isItemReady(itemData, battle, srcPlayer, targetPlayer)) {
            //const standardSteps = ItemFunctions.standardBattleSteps(itemData, srcPlayer, targetPlayer);
            const standardSteps = AbilityFunctions.standardSteps(item, battle, srcPlayer, targetPlayer);
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
        steps.push(BattleSteps.info(`${battle.player.name} escaped.`, 'escape', srcPlayer.getData().id))
        battle.active = false;
        battle.result = {
            status: 'escape',
            winner: null
        };
    }

    steps.push(...createReviveSteps(srcPlayer, targetPlayer));
    return steps;
}

function createAbilitySteps(ability, srcPlayer, targetPlayer, battle) {
    const steps = [];

    const actionWord = ability.getData().type === 'magical' ? 'casts' : 'used';
    const target = ability.getData().target === 'self' ? srcPlayer : targetPlayer;
    const infoStep = BattleSteps.info(`${srcPlayer.getData().name} ${actionWord} ${ability.getData().name}!`, 'ability', srcPlayer.getData().id, target.getData().id, ability.getData().animation);

    steps.push(infoStep);
    steps.push(...activateAbility(ability, srcPlayer, targetPlayer, battle));
        
    if(ability.getData().setCounterAbility) { //TODO put this in standard steps
        steps.push(BattleSteps.setCounter(srcPlayer, new Ability(ability.getData().setCounterAbility.ability), ability.getData().setCounterAbility.type));
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
            speed: ability.getData().setCounterAbility ? COUNTER_PRIORITY : ability.getData().speed
        }
    }

    else if(actionRequest.type === 'item') {
        const itemObject = battlePlayer.findObjectInBag(actionRequest.itemId);
        if(!itemObject) {
            throw new Error(ChatRPGErrors.itemNotEquipped);
        }
        const item = new Item(itemObject.content);

        playerBattleAction = {
            type: 'item',
            item: item,
            speed: ITEM_PRIORITY
        }

    }

    return playerBattleAction;
}

function createReviveStep(player) {
    if(!player.isDefeated() || !player.getData().autoRevive) {
        return;
    }

    const reviveStep = BattleSteps.revive(player);
    player.getData().autoRevive = 0;
    return reviveStep;
}

function createReviveSteps(player1, player2) {
    const steps = [];
    let reviveStep = createReviveStep(player1);

    if(reviveStep) {
        steps.push(reviveStep);
    }

    reviveStep = createReviveStep(player2);

    if(reviveStep) {
        steps.push(reviveStep);
    }
    return steps;
}

function activateAbility(ability, srcPlayer, targetPlayer, battle) {
    const steps = [];
    const standardSteps = AbilityFunctions.standardSteps(ability, battle, srcPlayer, targetPlayer);
    const abilitySteps = AbilityFunctions.effectSteps(ability, battle, srcPlayer, targetPlayer, {});

    if(standardSteps) {
        steps.push(...standardSteps);
    }
    if(abilitySteps) {
        steps.push(...abilitySteps);
    }
    return [...steps];
}

module.exports = {
    singlePlayerBattleIteration
}