const BattleSteps = require('../../battle-steps');

function testAbility1OnActivate(ability, battle, user, opponent, contextControl) {

    battle.environment.abilityTest1Activated = true;
    return [BattleSteps.info('Test ability 1 has activated.')];
}

const TestAbilitys = {
    testAbility1: {
        onActivate: testAbility1OnActivate
    }
};


module.exports = TestAbilitys;