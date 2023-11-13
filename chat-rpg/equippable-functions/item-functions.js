const BattleSteps = require('../battle-steps');
const ItemEffects = require('./item-effects/item-effects');

function IsItemReady(item, battle, user, opponent) {
    if(!ItemEffects[item.effectName] || !ItemEffects[item.effectName].isReady) {
        return true;
    }

    return ItemEffects[item.effectName].isReady(item, battle, user, opponent);
}

function GetNotReadyMessage(item) {
    if(!ItemEffects[item.effectName] || !ItemEffects[item.effectName].notReadyMessage) {
        return `This ${item.name} is not ready to be used.`;
    }

    return ItemEffects[item.effectName].notReadyMessage;
}

function StandardBattleSteps(item, srcPlayer, targetPlayer) {
    const steps = [];

    if(item.baseDamage > 0) {
        const damageStep = BattleSteps.damage(srcPlayer, item.baseDamage);
        steps.push(damageStep);
    }

    if(item.heal > 0) {
        const healStep = BattleSteps.heal(srcPlayer, srcPlayer, item.heal);
        steps.push(healStep);
    }

    return steps;
}

function EffectBattleSteps(item, battle, user, opponent, contextControl) {

    if(!ItemEffects[item.effectName] || !ItemEffects[item.effectName].onBattleActivate) {
        return;
    }

    return ItemEffects[item.effectName].onBattleActivate(item, battle, user, opponent, contextControl);
}

function StandardOutOfBattleEffects(item, user) {
    return '';
}

function OutOfBattleEffects(item, user) {
    if(!ItemEffects[item.effectName]) {
        return;
    }

    return ItemEffects[item.effectName].onActivate(item, user);
}

const ItemFunctions = {
    standardBattleSteps: StandardBattleSteps,
    effectBattleSteps: EffectBattleSteps,
    standardEffects: StandardOutOfBattleEffects,
    outOfBattleEffects: OutOfBattleEffects,
    isItemReady: IsItemReady,
    getNotReadyMessage: GetNotReadyMessage
};

module.exports = ItemFunctions;