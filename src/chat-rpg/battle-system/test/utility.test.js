const { BattleAgent } = require("../../datastore-objects/battle-agent");
const BattleSteps = require("../battle-steps");
const { calcAgentGrowth, agentGrowthAtLevel, findBattleSteps } = require("../utility");

test('Level up stat points gain helper function', () => {
    expect(agentGrowthAtLevel(-1)).toBe(0);
    expect(agentGrowthAtLevel(1)).toBe(0);

    for (let i = 2; i <= 100; i++) {
        expect(agentGrowthAtLevel(i)).toBe((i-1)*5);
    }

    expect(agentGrowthAtLevel(100)).toBe(495);

    for (let i = 101; i <= 200; i++) {
        expect(agentGrowthAtLevel(i)).toBe(495 + (i-100)*10);
    }

    expect(agentGrowthAtLevel(200)).toBe(1495);

    for (let i = 201; i <= 300; i++) {
        expect(agentGrowthAtLevel(i)).toBe(1495 + (i-200)*15);
    }

    expect(agentGrowthAtLevel(300)).toBe(1495 + 100 * 15);
});

test('Level up stat points gain', () => {
    expect(calcAgentGrowth(-1)).toBe(0);
    expect(calcAgentGrowth(1)).toBe(0);

    for (let i = 2; i <= 100; i++) {
        expect(calcAgentGrowth(i)).toBe((i-1)*5);
    }

    expect(calcAgentGrowth(100)).toBe(495);

    for (let i = 101; i <= 200; i++) {
        expect(calcAgentGrowth(i)).toBe(495 + (i-100)*10);
    }

    expect(calcAgentGrowth(200)).toBe(1495);

    for (let i = 201; i <= 300; i++) {
        expect(calcAgentGrowth(i)).toBe(1495 + (i-200)*15);
    }

    expect(calcAgentGrowth(300)).toBe(1495 + 100 * 15);

    // Growth from levels
    expect(calcAgentGrowth(1, 2)).toBe(0);
    expect(calcAgentGrowth(2, 1)).toBe(5);

    for (let i = 2; i <= 100; i++) {
        expect(calcAgentGrowth(i, i-1)).toBe(5);
    }

    expect(calcAgentGrowth(101, 100)).toBe(10);

    for (let i = 101; i <= 200; i++) {
        expect(calcAgentGrowth(i, i-1)).toBe(10);
    }

    expect(calcAgentGrowth(201, 200)).toBe(15);

    for (let i = 201; i <= 300; i++) {
        expect(calcAgentGrowth(i, i-1)).toBe(15);
    }

    expect(calcAgentGrowth(8, 4)).toBe(20);
    expect(calcAgentGrowth(108, 104)).toBe(40);
    expect(calcAgentGrowth(208, 204)).toBe(60);

    //Leveling across hundred level borders
    expect(calcAgentGrowth(101, 99)).toBe(15);
    expect(calcAgentGrowth(250, 50)).toBe(2000);
});

test('Find all battle steps', () => {
    const agent = new BattleAgent();
    const steps = [
        BattleSteps.damage(agent, 1, ''),
        BattleSteps.info(''),
        BattleSteps.damage(agent, 1, ''),
        BattleSteps.info(''),
        BattleSteps.damage(agent, 1, ''),
        BattleSteps.info(''),
    ];

    const damageSteps = findBattleSteps('damage', steps);

    expect(damageSteps.length).toBe(3);
    for (const step of damageSteps) {
        expect(step.type).toMatch('damage');
    }
});
