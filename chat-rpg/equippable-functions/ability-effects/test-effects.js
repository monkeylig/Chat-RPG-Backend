const BattleSteps = require('../../battle-steps');

function testAbility1OnActivate(ability, battle, user, opponent, contextControl) {

    battle.environment.abilityTest1Activated = true;
    return [BattleSteps.info('Test ability 1 has activated.')];
}

function testAbility1OverrideBaseDamage(ability, battle, user, opponent) {
    return 55;
}

const TestAbilitys = {
    testAbility1: {
        onActivate: testAbility1OnActivate,
        overrideBaseDamage: testAbility1OverrideBaseDamage
    }
};


module.exports = TestAbilitys;