const BattleSteps = require('../battle-steps');
const ItemEffects = require('./item-effects/item-effects');

function StandardBattleSteps(item, srcPlayer, targetPlayer) {
    const steps = [];

    if(item.baseDamage > 0) {
        const damageStep = BattleSteps.damage(srcPlayer, targetPlayer, item.baseDamage);
        steps.push(damageStep);
    }

    return steps;
}

function EffectBattleSteps(item, battle, user, opponent, contextControl) {

    if(!ItemEffects[item.effectName]) {
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
    outOfBattleEffects: OutOfBattleEffects
};

module.exports = ItemFunctions;