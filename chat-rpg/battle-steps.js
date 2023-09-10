const { BattlePlayer } = require("./datastore-objects/battle-agent");
const { BattleWeapon } = require("./datastore-objects/weapon");

function damageStep(srcPlayer, targetPlayer, baseDamage, damageType) {
    const srcPlayerData = srcPlayer.getData();
    const targetPlayerData = targetPlayer.getData();
    const damageStep = {
        type: 'damage',
        actorId: srcPlayerData.id,
        targetId: targetPlayerData.id,
        damage: 0
    };

    if(!damageType) {
        throw new Error('Missing param!');
    }
    const power = damageType === 'magical' ? srcPlayer.getModifiedMagic() : srcPlayer.getModifiedStrength();

    // make sure we don't devide by 0
    let defence = 1;
    if(targetPlayer.getModifiedDefence()) {
        defence = targetPlayer.getModifiedDefence();
    }

    const damage = Math.floor(((2 * srcPlayerData.level / 5 + 2) * baseDamage * power / defence) / 50 + 2);
    damageStep.damage = Math.min(damage, targetPlayerData.health);
    //Apply damage step
    targetPlayerData.health -= damageStep.damage;

    return damageStep;
}

function healStep(srcPlayer, targetPlayer, healAmount) {
    const srcPlayerData = srcPlayer.getData();
    const targetPlayerData = targetPlayer.getData();
    const healStep = {
        type: 'heal',
        actorId: srcPlayerData.id,
        targetId: targetPlayerData.id,
        healAmount: 0
    };

    healStep.healAmount = targetPlayer.heal(healAmount);

    return healStep;
}

function infoStep(description, action, actorId='', targetId='', animation={}) {
    const infoStep = {
        type: 'info',
        description,
        action: action ? action : 'generic',
        actorId: actorId,
        targetId: targetId
    };

    if(animation) {
        infoStep.animation = animation;
    }

    return infoStep;
}

function battleEndStep(description) {
    return {
        type: 'battle_end',
        description
    };
}

function statAmpStep(battlePlayer, stat, ampFunctionName, stages, prefix) {

    let descBeginning = `${battlePlayer.getData().name}'s ${stat}`;
    if(prefix) {
        descBeginning = prefix;
    }

    if(!battlePlayer[ampFunctionName](stages)) {
        return infoStep(`${descBeginning} can't rise any higher.`);
    }

    switch(stages) {
        case 0: {
            return {
                type: ampFunctionName,
                description: `${descBeginning} did not rise at all.`
            };
        }
        case 1: {
            return {
                type: ampFunctionName,
                description: `${descBeginning} rose slightly.`
            };
        }
        case -1: {
            return {
                type: ampFunctionName,
                description: `${descBeginning} fell slightly.`
            };
        }
        case 3: {
            return {
                type: ampFunctionName,
                description: `${descBeginning} rose suddenly!`
            };
        }
        case -3: {
            return {
                type: ampFunctionName,
                description: `${descBeginning} fell suddenly!`
            };
        }
        case 4: {
            return {
                type: ampFunctionName,
                description: `${descBeginning} rose greatly!`
            };
        }
        case -4: {
            return {
                type: ampFunctionName,
                description: `${descBeginning} fell greatly!`
            };
        }
        case 2:
        default: {
            return {
                type: ampFunctionName,
                description: stages > 0 ? `${descBeginning} rose!` : `${descBeginning} fell.`
            };
        }
    }
}

function strengthAmpStep(battlePlayer, stages) {
    return statAmpStep(battlePlayer, 'strength', 'strengthAmp', stages);
}

function defenceAmpStep(battlePlayer, stages) {
    return statAmpStep(battlePlayer, 'defence', 'defenceAmp', stages);
}

function magicAmpStep(battlePlayer, stages) {
    return statAmpStep(battlePlayer, 'magic', 'magicAmp', stages);
}

function weaponSpeedAmpStep(battlePlayer, stages) {
    const weapon = new BattleWeapon(battlePlayer.getData().weapon);
    const speedAmpStep = statAmpStep(weapon, 'speed', 'speedAmp', stages, `${battlePlayer.getData().name}'s weapon speed`);
    battlePlayer.getData().weapon = weapon.getData();
    return speedAmpStep;
}

function empowermentStep(battlePlayer, empowerType, empowerValue) {
    if(!battlePlayer.getData().empowerment.hasOwnProperty(empowerType)){
        battlePlayer.getData().empowerment[empowerType] = 0;
    }

    battlePlayer.getData().empowerment[empowerType] += empowerValue;

    return {
        type: 'empowerment',
        description: `${battlePlayer.getData().name} gained ${empowerType} empowerment!`
    };
}

function reviveStep(battlePlayer) {
    if (!battlePlayer.isDefeated()) {
        return BattleSteps.info(`${battlePlayer.getData().name} is not defeated.`);
    }

    battlePlayer.revive();

    return {
        type: 'revive',
        actorId: battlePlayer.getData().id,
        targetId: battlePlayer.getData().id,
        healAmount: battlePlayer.getData().health,
        description: `${battlePlayer.getData().name} was revived!`
    };
}

function apCostStep(battlePlayer, apCost) {
    const battlePlayerData = battlePlayer.getData();
    const netCost = Math.min(apCost, battlePlayerData.ap);
    battlePlayerData.ap -= netCost;

    return {
        type: 'apCost',
        actorId: battlePlayer.getData().id,
        apCost: netCost
    };
}

const BattleSteps = {
    damage: damageStep,
    heal: healStep,
    info: infoStep,
    battleEnd: battleEndStep,
    strengthAmp: strengthAmpStep,
    defenceAmp: defenceAmpStep,
    magicAmp: magicAmpStep,
    weaponSpeedAmp: weaponSpeedAmpStep,
    empowerment: empowermentStep,
    revive: reviveStep,
    apCost: apCostStep
};

module.exports = BattleSteps;