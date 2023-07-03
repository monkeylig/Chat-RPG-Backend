const BattleSteps = require('../../battle-steps');

function testItem1OnBattleActivate(item, battle, user, opponent, contextControl) {

    battle.environment.itemTest1Activated = true;
    return [BattleSteps.info('Test item 1 has activated in a battle.')];
}

function testItem1OnActivate(item, user) {
    return 'Test item 1 has activated out of battle.';
}

function testItem2OnBattleActivate(item, battle, user, opponent, contextControl) {

    battle.environment.itemTest2Activated = true;
    return [BattleSteps.info('Test item 2 has activated in a battle.')];
}

function testItem2OnActivate(item, user) {
    return 'Test item 2 has activated out of battle.';
}


function testItem3OnBattleActivate(item, battle, user, opponent, contextControl) {

    battle.environment.itemTest3Activated = true;
    return [BattleSteps.info('Test item 3 has activated in a battle.')];
}

function testItem3IsReady(item, battle, user, opponent) {
    return false
}

const TestItems = {
    testItem1: {
        onBattleActivate: testItem1OnBattleActivate,
        onActivate: testItem1OnActivate
    },
    testItem2: {
        onBattleActivate: testItem2OnBattleActivate,
        onActivate: testItem2OnActivate
    },
    testItem3: {
        onBattleActivate: testItem3OnBattleActivate,
        isReady: testItem3IsReady,
        notReadyMessage: 'This item is not ready yet'
    }
};


module.exports = TestItems;