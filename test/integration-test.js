test_create_new_player = require('./create_new_player_test');
test_get_starting_avatars = require('./get_starting_avatars_test');
test_get_player = require('./get-player-test');
test_join_game = require('./join_game_test');
test_start_battle = require('./start_battle_test');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0" // Avoids DEPTH_ZERO_SELF_SIGNED_CERT error for self-signed certs
process.env.FIRESTORE_EMULATOR_HOST = "localhost:9000"

async function RunSyncTests() {
    /*await test_get_starting_avatars();
    await test_create_new_player();
    await test_get_player();
    await test_join_game();*/
    await test_start_battle();
}

function RunAsyncTests() {
    test_get_starting_avatars();
    test_create_new_player();
    test_get_player();
    test_join_game();
}

async function Run() {
    console.log("Running synchronous tests.............\n");
    await RunSyncTests();

    /*console.log("Running asynchronous tests.............\n");
    RunAsyncTests();*/
}

Run();