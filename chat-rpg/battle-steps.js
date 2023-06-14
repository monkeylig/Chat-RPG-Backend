
function damageStep(srcPlayer, targetPlayer, baseDamage) {
    const damageStep = {
        type: 'damage',
        actorId: srcPlayer.id
    };

    const modifier = srcPlayer.weapon.modifier ? srcPlayer.weapon.modifier : 'attack';

    // make sure we don't devide by 0
    let defence = 1;
    if(targetPlayer.defence) {
        defence = targetPlayer.defence;
    }
 
    damageStep.damage = Math.floor(((2 * srcPlayer.level / 5 + 2) * baseDamage * srcPlayer[modifier] / defence) / 50 + 2);

    //Apply damage step
    targetPlayer.health -= Math.min(damageStep.damage, targetPlayer.health);

    return damageStep;
}

function infoStep(description, action, actorId) {
    return {
        type: 'info',
        description,
        action: action ? action : 'generic',
        actorId: actorId
    };
}

function battleEndStep(description) {
    return {
        type: 'battle_end',
        description
    };
}

const BattleSteps = {
    damage: damageStep,
    info: infoStep,
    battleEnd: battleEndStep
};

module.exports = BattleSteps;