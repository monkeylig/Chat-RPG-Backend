/**
 * @import {Action} from "../../action"
 */

const Ability = require("../../../datastore-objects/ability");
const { BattleContext } = require("../../battle-context");
const { generateActions } = require("../multi-hit-attack");

test('Multi Attack', () => {
    const battleContext = new BattleContext();
    const ability = new Ability({
        baseDamage: 50,
        target: 'opponent'
    });

    for (let i = 0; i < 100; i++) {
        const actions = generateActions(battleContext.player, ability.getData(), {minHits: 5, maxHits: 10}, battleContext);

        let hitCount = 0;
        let infoFound = false;
        for (const action of actions) {
            if (action.playerAction && action.playerAction.baseDamage) {
                hitCount++;
                expect(action.playerAction.baseDamage).toBe(50);
                expect(action.playerAction.targetPlayer).toBe(battleContext.monster);
            }
            else if (action.infoAction) {
                infoFound = true;
                break;
            }
        }

        expect(hitCount).toBeGreaterThanOrEqual(5);
        expect(hitCount).toBeGreaterThanOrEqual(5);
        expect(infoFound).toBeTruthy();
        expect(actions.next().done).toBeTruthy();
    }
});