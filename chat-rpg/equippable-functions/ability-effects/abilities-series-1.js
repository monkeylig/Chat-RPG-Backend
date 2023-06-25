const BattleSteps = require('../../battle-steps');
const {BattleWeapon} = require('../../datastore-objects/weapon');

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

function decadeBlastOverrideBaseDamage(ability, battle, user, opponent) {
    return ability.getData().baseDamage + ability.getSpecialStat('damgeIncrease') * battle.round;
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
    }
};


module.exports = AbilitiesSeries1;