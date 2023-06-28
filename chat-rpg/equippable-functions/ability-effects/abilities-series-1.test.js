const AbilityEffects = require('./ability-effects');
const Ability = require('../../datastore-objects/ability');
const {BattlePlayer} = require('../../datastore-objects/battle-agent');
const {BattleWeapon, Weapon} = require('../../datastore-objects/weapon');
const chatRPGUtility = require('../../utility');
const seedrandom = require('seedrandom');

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

test('Rapid Slash', () => {
    expect(AbilityEffects.rapidSlash).toBeDefined();
    expect(AbilityEffects.rapidSlash.onActivate).toBeDefined();
    chatRPGUtility.random = seedrandom('Fight!');
    
    const player1 = new BattlePlayer();
    const player2 = new BattlePlayer();
    const ability = new Ability({
        baseDamage: 30,
        specialStats: {
            maxHits: 10
        }
    });

    let hitSteps = AbilityEffects.rapidSlash.onActivate(ability, {}, player1, player2, {});
    
    expect(hitSteps.length).toBeGreaterThan(4);
});

test('Sacred Slash', () => {
    expect(AbilityEffects.sacredSlash).toBeDefined();
    expect(AbilityEffects.sacredSlash.overrideBaseDamage).toBeDefined();
    
    const player = new BattlePlayer();
    const ability = new Ability({
        baseDamage: 50,
        specialStats: {
            maxDamage: 120
        }
    });

    let baseDamage = AbilityEffects.sacredSlash.overrideBaseDamage(ability, {}, player, {});
    
    expect(baseDamage).toBe(120);

    player.getData().health = 5;

    baseDamage = AbilityEffects.sacredSlash.overrideBaseDamage(ability, {}, player, {});

    expect(baseDamage).toBe(ability.getData().baseDamage + 70 * player.getData().health / player.getData().maxHealth);

});