test_create_new_player = require('./create_new_player_test');
test_get_starting_avatars = require('./get_starting_avatars_test');
test_get_player = require('./get-player-test');
test_join_game = require('./join_game_test');
test_get_game = require('./get_game_test');
test_start_battle = require('./start_battle_test');
test_battle_action = require('./battle_action_test');
test_equip_weapon = require('./equip-weapon-test');
test_drop_weapon = require('./drop-weapon-test')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0" // Avoids DEPTH_ZERO_SELF_SIGNED_CERT error for self-signed certs
process.env.FIRESTORE_EMULATOR_HOST = "localhost:9000"

function RunAsyncTests() {
    /*test_get_starting_avatars();
    test_create_new_player();
    test_get_player();
    test_join_game();
    test_start_battle();
    test_battle_action();
    test_get_game();
    test_equip_weapon();*/
    test_drop_weapon();
}

async function Run() {
    console.log("Running Tests.............\n");
    RunAsyncTests();
}

Run();