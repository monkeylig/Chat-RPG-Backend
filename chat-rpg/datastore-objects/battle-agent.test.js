const {BattlePlayer, BattleMonster} = require('./battle-agent');
const MAX_ATTACK_AMP = 12;

test('Attack mod', () => {
    const startingAttack = 50;
    const player = new BattlePlayer({attack: startingAttack});

    expect(player.getModifiedAttack()).toBe(startingAttack);

    player.slightAttackAmp();

    expect(player.getModifiedAttack()).toBe(startingAttack + startingAttack * (1 / MAX_ATTACK_AMP));

    const monster = new BattleMonster({attack: startingAttack});

    expect(monster.getModifiedAttack()).toBe(startingAttack);

    monster.slightAttackAmp();

    expect(monster.getModifiedAttack()).toBe(startingAttack + startingAttack * (1 / MAX_ATTACK_AMP));
});