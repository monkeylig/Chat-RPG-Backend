const BattleSteps = require('../../battle-steps');
const Ability = require('../../datastore-objects/ability');
const { BattleWeapon } = require('../../datastore-objects/battle-agent');
const gameplayObjects = require('../../gameplay-objects');

const chatRPGUtility = require('../../utility');
const StandardSteps = require('./standard-steps');

//#region skyscraper 
function skyscraperOverrideBaseDamage(ability, battle, user, opponent) {
    const damageScalar = ability.getSpecialStat('damageMultiplier');
    const weapon = new BattleWeapon(user.getData().weapon);
    return Math.max(ability.getData().baseDamage, ability.getData().baseDamage + (weapon.getModifiedSpeed() - weapon.getData().speed) * damageScalar);
}
//#endregion

//#region Knights Honor 
function knightsHonorOverrideBaseDamage(ability, battle, user, opponent) {
    return user.getData().ap === 0 ? ability.getSpecialStat('superDamage') : ability.getData().baseDamage;
}
//#endregion

//#region decadeBlast
function decadeBlastOverrideBaseDamage(ability, battle, user, opponent) {
    return ability.getData().baseDamage + ability.getSpecialStat('damgeIncrease', 0) * battle.round;
}
//#endregion

//#region rapidSlash
function rapidSlashOnActivate(ability, battle, user, opponent, contextControl) {
    const hits = chatRPGUtility.getRandomIntInclusive(ability.getSpecialStat('minHits', 0), ability.getSpecialStat('maxHits', ability.getSpecialStat('minHits', 0)));
    const steps = [];

    let hitCount = 1;
    for(let i = 1; i < hits; i++) {
        if(!opponent.isDefeated()) {
            hitCount += 1;
            steps.push(BattleSteps.info('', 'hit', user.getData().id, opponent.getData().id, ability.getData().animation));
            steps.push(...BattleSteps.genHitSteps(user, opponent, ability.getData().baseDamage, ability.getData().type, ability.getData().style, ability.getData().elements));
        }
    }

    steps.push(BattleSteps.info(`${user.getData().name} hit ${opponent.getData().name} ${hitCount} times!`));
    return steps;
}
//#endregion

//#region sacredSlash
function sacredSlashOverrideBaseDamage(ability, battle, user, opponent) {
    const extraDamage = Math.max(ability.getSpecialStat('maxDamage', 0) - ability.getData().baseDamage, 0);
    return ability.getData().baseDamage + (extraDamage * user.getData().health / user.getData().maxHealth);
}
//#endregion

//#region arcticFang TODO Make a test
function arcticFangOnActivate(ability, battle, user, opponent, contextControl) {
    const steps = [];
    if(opponent.getStatusEffect(gameplayObjects.statusEffects.drenched.name)) {
        steps.push(BattleSteps.imbue(user, 'water', 'strikeAbility'));
    }

    return steps;
}
//#endregion

//#region protection attacks
function protectionAttackOnActivate(ability, battle, user, opponent, contextControl) {
    const steps = [];

    const portectionType = ability.getSpecialStat('protectionType', 'physical');
    const baseDamage = ability.getSpecialStat('minBaseDamage', 0) + user.getProtectionValue(portectionType);

    steps.push(...BattleSteps.genHitSteps(user, opponent, baseDamage, ability.getData().type, ability.getData().style, ability.getData().elements));
    return steps;
}
//#endregion

//#region inflame attack bonus
function inflameAttackBonusOverrideBaseDamage(ability, battle, user, opponent) {
    return opponent.getStatusEffect(gameplayObjects.statusEffects.inflamed) ? ability.getSpecialStat('superDamage', 0) : ability.getData().baseDamage;
}
//#endregion

//#region status attack bonus
function statusAttackBonusOverrideBaseDamage(ability, battle, user, opponent) {
    if(opponent.getStatusEffect(ability.getSpecialStat('status'))) {
        return ability.getData().baseDamage + ability.getSpecialStat('baseDamageBonus', 0)
    }
    return ability.getData().baseDamage;
}
//#endregion

function statusAttackOnActivate(ability, battle, user, opponent, contextControl) {
    if(opponent.getStatusEffect(ability.getSpecialStat('status'))) {
        return StandardSteps(new Ability(ability.getSpecialStat('effect')), battle, user, opponent)
    }

    return [];
}

const AbilitiesSeries1 = {
    skyscraper: {
        overrideBaseDamage: skyscraperOverrideBaseDamage
    },
    knightsHonor: {
        overrideBaseDamage: knightsHonorOverrideBaseDamage
    },
    decadeBlast: {
        overrideBaseDamage: decadeBlastOverrideBaseDamage
    },
    rapidSlash: {
        onActivate: rapidSlashOnActivate
    },
    sacredSlash: {
        overrideBaseDamage: sacredSlashOverrideBaseDamage
    },
    arcticFang: {
        onActivate: arcticFangOnActivate
    },
    protectionAttack: {
        onActivate: protectionAttackOnActivate
    },
    inflameAttackBonus: {
        overrideBaseDamage: inflameAttackBonusOverrideBaseDamage
    },
    statusAttackBonus: {
        overrideBaseDamage: statusAttackBonusOverrideBaseDamage
    },
    statusAttack: {
        onActivate: statusAttackOnActivate
    }
};


module.exports = AbilitiesSeries1;