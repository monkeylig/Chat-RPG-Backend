const { BattleWeapon } = require("./datastore-objects/weapon");

function damageStep(srcPlayer, targetPlayer, baseDamage) {
    const srcPlayerData = srcPlayer.getData();
    const targetPlayerData = targetPlayer.getData();
    const damageStep = {
        type: 'damage',
        actorId: srcPlayerData.id,
        targetId: targetPlayerData.id,
        damage: 0
    };

    const power = srcPlayerData.weapon.type === 'magical' ? srcPlayer.getModifiedMagic() : srcPlayer.getModifiedAttack();

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

function infoStep(description, action, actorId='', animation) {
    const infoStep = {
        type: 'info',
        description,
        action: action ? action : 'generic',
        actorId: actorId
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

function statAmpStep(battlePlayer, stat, ampFunctionName, stages) {
    if(!battlePlayer[ampFunctionName](stages)) {
        return infoStep(`${battlePlayer.getData().name}'s ${stat} can't rise any higher.`);
    }

    switch(stages) {
        case 0: {
            return {
                type: ampFunctionName,
                description: `${battlePlayer.getData().name}'s ${stat} did not rise at all.`
            };
        }
        case 1: {
            return {
                type: ampFunctionName,
                description: `${battlePlayer.getData().name}'s ${stat} rose slightly.`
            };
        }
        case 3: {
            return {
                type: ampFunctionName,
                description: `${battlePlayer.getData().name}'s ${stat} rose suddenly!`
            };
        }
        case 4: {
            return {
                type: ampFunctionName,
                description: `${battlePlayer.getData().name}'s ${stat} rose greatly!`
            };
        }
        case 2:
        default: {
            return {
                type: ampFunctionName,
                description: `${battlePlayer.getData().name}'s ${stat} rose!`
            };
        }
    }
}

function attackAmpStep(battlePlayer, stages) {
    return statAmpStep(battlePlayer, 'attack', 'attackAmp', stages);
}

function defenceAmpStep(battlePlayer, stages) {
    return statAmpStep(battlePlayer, 'defence', 'defenceAmp', stages);
}

function speedAmpStep(battlePlayer, stages) {
    return statAmpStep(battlePlayer, 'speed', 'speedAmp', stages);
}

function magicAmpStep(battlePlayer, stages) {
    return statAmpStep(battlePlayer, 'magic', 'magicAmp', stages);
}

function weaponSpeedAmpStep(battlePlayer, stages) {
    const weapon = new BattleWeapon(battlePlayer.getData().weapon);
    const speedAmpStep = statAmpStep(weapon, 'speed', 'speedAmp', stages);
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

const BattleSteps = {
    damage: damageStep,
    heal: healStep,
    info: infoStep,
    battleEnd: battleEndStep,
    attackAmp: attackAmpStep,
    defenceAmp: defenceAmpStep,
    magicAmp: magicAmpStep,
    speedAmp: speedAmpStep,
    weaponSpeedAmp: weaponSpeedAmpStep,
    empowerment: empowermentStep
};

module.exports = BattleSteps;