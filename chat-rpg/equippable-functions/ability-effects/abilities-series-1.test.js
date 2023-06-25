const AbilityEffects = require('./ability-effects');
const Ability = require('../../datastore-objects/ability');
const {BattlePlayer} = require('../../datastore-objects/battle-agent');
const {BattleWeapon, Weapon} = require('../../datastore-objects/weapon')

test('Skyscraper', () => {
    expect(AbilityEffects.skyscraper).toBeDefined();
    expect(AbilityEffects.skyscraper.overrideBaseDamage).toBeDefined();

    const player = new BattlePlayer();
    const ability = new Ability({baseDamage: 10});

    let baseDamage = AbilityEffects.skyscraper.overrideBaseDamage(ability, {}, player, {});

    expect(baseDamage).toBe(10);

    const weapon = new BattleWeapon(player.getData().weapon);
    weapon.speedAmp(2);
    player.getData().weapon = weapon.getData();

    baseDamage = AbilityEffects.skyscraper.overrideBaseDamage(ability, {}, player, {});

    expect(baseDamage).toBe(15);
});

test('Knight\'s Honor', () => {
    expect(AbilityEffects.knightsHonor).toBeDefined();
    expect(AbilityEffects.knightsHonor.overrideBaseDamage).toBeDefined();
    
    const player = new BattlePlayer();
    const ability = new Ability({
        baseDamage: 70,
        specialStats: {
            superDamage: 180
        }
    });

    let baseDamage = AbilityEffects.knightsHonor.overrideBaseDamage(ability, {}, player, {});
    
    expect(baseDamage).toBe(70);

    player.getData().ap = 0;

    baseDamage = AbilityEffects.knightsHonor.overrideBaseDamage(ability, {}, player, {});

    expect(baseDamage).toBe(180);
});

test('Decade Blast', () => {
    expect(AbilityEffects.decadeBlast).toBeDefined();
    expect(AbilityEffects.decadeBlast.overrideBaseDamage).toBeDefined();
    
    const player = new BattlePlayer();
    const ability = new Ability({
        baseDamage: 30,
        specialStats: {
            damgeIncrease: 10
        }
    });

    let baseDamage = AbilityEffects.decadeBlast.overrideBaseDamage(ability, {round: 6}, player, {});
    
    expect(baseDamage).toBe(90);
});