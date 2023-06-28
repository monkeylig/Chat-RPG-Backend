const BattleSteps = require('../../battle-steps');
const {BattleWeapon} = require('../../datastore-objects/weapon');

const chatRPGUtility = require('../../utility');

//#region skyscraper 
function skyscraperOverrideBaseDamage(ability, battle, user, opponent) {
    const damageScalar = 10;
    const weapon = new BattleWeapon(user.getData().weapon);
    return Math.max(ability.getData().baseDamage, ability.getData().baseDamage + weapon.getModifiedSpeed() * damageScalar - weapon.getData().speed * damageScalar);
}
//#endregion

//#region Knights Honor 
function knightsHonorOverrideBaseDamage(ability, battle, user, opponent) {
    return user.getData().ap === 0 ? ability.getSpecialStat('superDamage') : ability.getData().baseDamage;
}
//#endregion

//#region decadeBlast
function decadeBlastOverrideBaseDamage(ability, battle, user, opponent) {
    return ability.getData().baseDamage + ability.getSpecialStat('damgeIncrease') * battle.round;
}
//#endregion

//#region rapidSlash
function rapidSlashOnActivate(ability, battle, user, opponent, contextControl) {
    const hits = chatRPGUtility.getRandomIntInclusive(0, ability.getSpecialStat('maxHits'));
    const steps = [];

    for(let i = 0; i < hits; i++) {
        if(!opponent.isDefeated()) {
            steps.push(BattleSteps.info('', 'hit', user.id, ability.getData().animation));
            steps.push(BattleSteps.damage(user, opponent, ability.getData().baseDamage));
        }
    }

    steps.push(BattleSteps.info(`${user.getData().name} hit ${opponent.getData().name} ${hits + 1} times!`));
    return steps;
}
//#endregion

//#region sacredSlash
function sacredSlashOverrideBaseDamage(ability, battle, user, opponent) {
    const extraDamage = Math.max(ability.getSpecialStat('maxDamage') - ability.getData().baseDamage, 0);
    return ability.getData().baseDamage + (extraDamage * user.getData().health / user.getData().maxHealth);
}
//#endregion

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
    }
};


module.exports = AbilitiesSeries1;