const Revive = require("./revive");
const NoApDamageBoost = require("./no-ap-damage-boost");
const MultiHitAttack = require("./multi-hit-attack");
const HealthBasedDamage = require("./health-based-damage");
const SpeedDamageBoost = require('./speed-damage-boost');
const ProtectionAttack = require('./protection-attack');
const EffectBoost = require('./effect-boost');
const RoundDamageBoost = require('./round-damage-boost');
const IsHealthFull = require('./is-full-health');
const RestoreAP = require('./restore-ap');
const IsReviveSet = require('./is-revive-set');

module.exports = {
    Revive,
    NoApDamageBoost,
    MultiHitAttack,
    HealthBasedDamage,
    SpeedDamageBoost,
    RoundDamageBoost,
    ProtectionAttack,
    EffectBoost,
    IsHealthFull,
    RestoreAP,
    IsReviveSet,
}