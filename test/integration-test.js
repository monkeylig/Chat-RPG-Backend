const fs = require('fs');
test_create_new_player = require('./create_new_player_test');
test_get_starting_avatars = require('./get_starting_avatars_test');
test_get_player = require('./get-player-test');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0" // Avoids DEPTH_ZERO_SELF_SIGNED_CERT error for self-signed certs

async function RunSyncTests() {
    await test_get_starting_avatars();
    await test_create_new_player();
    await test_get_player();
}

RunSyncTests();
//get_starting_avatars.test_get_starting_avatars();
//test_create_new_player();