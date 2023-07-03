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
    user.getData().reviveReady = true;
    return [BattleSteps.info(`${user.getData().name} will be revive if they are defeated.`)];
}
//#endregion

const ItemsSeries1 = {
    potion: {
        isReady: PotionIsReady,
        notReadyMessage: 'Hp is already full.'
    },
    pheonixDown: {
        onBattleActivate: PheonixDownOnBattleActivate,
        isReady: PheonixDownIsReady,
        notReadyMessage: 'Pheonix Down is already active.'
    }
};

module.exports = ItemsSeries1;