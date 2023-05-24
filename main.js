const LISTEN_PORT = 3000;

const https = require('https');
const fs = require('fs');
const express = require('express');

const ChatRPG = require('./chat-rpg/chat-rpg');
const FirebaseDataSource = require('./data-source/firebase-data-source');
const MemoryBackedDataSource = require('./data-source/memory-backed-data-source');
const utility = require('./utility');
const endpoints = require('./endpoints/endpoints');

const dataSourceFileName = 'chat-rpg-data-source.json';

const Headers = {
    Platform: 'chat-rpg-platform'
}

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
    app.get('/get_game', (req, res) => endpoints.get_game(req, res, chatrpg))
    app.post('/start_battle', (req, res) => endpoints.start_battle(req, res, chatrpg));
    app.post('/battle_action', (req, res) => endpoints.battle_action(req, res, chatrpg));
    app.post('/equip_weapon', (req, res) => endpoints.equip_weapon(req, res, chatrpg));
    app.post('/drop_weapon', (req, res) => endpoints.drop_weapon(req, res, chatrpg));

    const options = {
        key: fs.readFileSync('yourdomain.key'),
        cert: fs.readFileSync('domain.crt')
    };
    let server = https.createServer(options, app);

    server.listen(LISTEN_PORT, () => {
        console.log(`Server running at port ${LISTEN_PORT}`)
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