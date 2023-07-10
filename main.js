const LOCAL_TEST_PORT = 3000;

const fs = require('fs');
const express = require('express');

const ChatRPG = require('./chat-rpg/chat-rpg');
const FirebaseDataSource = require('./data-source/firebase-data-source');
const MemoryBackedDataSource = require('./data-source/memory-backed-data-source');
const utility = require('./utility');
const endpoints = require('./endpoints/endpoints');

function startServer(dataSource) {
    console.log('starting server');

    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true })) // for parsing query strings

    const chatrpg = new ChatRPG(dataSource);

    app.get('/', endpoints.welcome);
    app.get('/get_starting_avatars', (req, res) => endpoints.get_starting_avatars(req, res, chatrpg));
    app.options('/create_new_player', endpoints.create_new_player_options);
    app.put('/create_new_player', (req, res) => endpoints.create_new_player(req, res, chatrpg));
    app.get('/get_player', (req, res) => endpoints.get_player(req, res, chatrpg));
    app.post('/join_game', (req, res) => endpoints.join_game(req, res, chatrpg));
    app.get('/get_game', (req, res) => endpoints.get_game(req, res, chatrpg));
    app.options('/start_battle', endpoints.start_battle_options);
    app.post('/start_battle', (req, res) => endpoints.start_battle(req, res, chatrpg));
    app.post('/battle_action', (req, res) => endpoints.battle_action(req, res, chatrpg));
    app.post('/equip_weapon', (req, res) => endpoints.equip_weapon(req, res, chatrpg));
    app.post('/drop_weapon', (req, res) => endpoints.drop_weapon(req, res, chatrpg));
    app.post('/equip_ability', (req, res) => endpoints.equip_ability(req, res, chatrpg));
    app.post('/drop_book', (req, res) => endpoints.drop_book(req, res, chatrpg));
    app.post('/drop_item', (req, res) => endpoints.drop_item(req, res, chatrpg));
    app.get('/get_shop', (req, res) => endpoints.get_shop(req, res, chatrpg));
    app.post('/buy', (req, res) => endpoints.buy(req, res, chatrpg));

    const PORT = process.env.PORT || LOCAL_TEST_PORT;
    app.listen(PORT, () => {
        console.log(`Server running at port ${PORT}`);
    });
}

async function initialization() {
    /*const dataSource = new MemoryBackedDataSource();
    await dataSource.initializeDataSource(utility.sampleData);*/

    const dataSource = new FirebaseDataSource();
    await dataSource.initializeDataSource();

    return dataSource;
}

function main () {
    initialization().then(dataSource => {
        startServer(dataSource);
    });
}

main();