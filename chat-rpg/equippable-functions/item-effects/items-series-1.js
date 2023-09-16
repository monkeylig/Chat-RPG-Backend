const BattleSteps = require('../../battle-steps');

//#region Potion
function PotionIsReady(item, battle, user, opponent) {
    return user.getData().health < user.getData().maxHealth;
}
//#endregion

//#region Pheonix Down
function PheonixDownIsReady(item, battle, user, opponent) {
    return !user.getData().reviveReady;
}

function PheonixDownOnBattleActivate(item, battle, user, opponent, contextControl) {
    return [BattleSteps.readyRevive(user)];
}
//#endregion

const ItemsSeries1 = {
    potion: {
        isReady: PotionIsReady,
        notReadyMessage: 'HP is already full.'
    },
    pheonixDown: {
        onBattleActivate: PheonixDownOnBattleActivate,
        isReady: PheonixDownIsReady,
        notReadyMessage: 'Phoenix Down is already active.'
    }
};

module.exports = ItemsSeries1;