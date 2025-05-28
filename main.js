/**
 * @import {Request, Response} from 'express'
 */
const LOCAL_TEST_PORT = 4000;

const express = require('express');

const ChatRPG = require('./chat-rpg/chat-rpg');
const FirebaseDataSource = require('./data-source/firebase-data-source');
const MemoryBackedDataSource = require('./data-source/memory-backed-data-source');
const endpoints = require('./endpoints/endpoints');
const utility = require('./utility');
var cron = require('node-cron');

let twitchExtentionSecret;

/**
 * 
 * @param {Request} req 
 * @param {Response} res 
 * @param {() => void} next 
 * @returns 
 */
function twitchJWTValidation(req, res, next) {
    
    if(req.method === 'OPTIONS') {
        next();
        return;
    }
    else if(
        req.path === "/refresh_daily_shop" ||
        req.path === "/daily_operations") {
        next();
        return;
    }

    const rejectRequest = (message) => {
        res.status(401);
        res.set('Access-Control-Allow-Origin', '*');
        res.send(message);
    };

    const authHeader = req.get('Authorization');
    if(!authHeader) {
        rejectRequest('Unauthorized');
        return;
    }

    const auth = authHeader.split(' ');

    if(auth[0] !== 'bearer') {
        rejectRequest('Unauthorized');
        return;
    }

    try {
        const payload = utility.verifyJWT(auth[1], twitchExtentionSecret);
        req.twitchUser = payload;
    }
    catch (/**@type {any}*/error) {
        res.status(401);
        res.set('Access-Control-Allow-Origin', '*');
        res.send(error.message);
        return;
    }
    next();
}

function startServer(dataSource) {
    console.log('starting server');

    const app = express();

    if(process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'pre-production') {
        app.use(twitchJWTValidation);
    }
    app.use(express.json());
    app.use(express.urlencoded({ extended: true })) // for parsing query strings

    const chatrpg = new ChatRPG(dataSource);

    app.use(endpoints.default_options);
    app.get('/', endpoints.welcome);
    app.get('/get_starting_avatars', (req, res) => endpoints.get_starting_avatars(req, res, chatrpg));
    app.get('/get_game_info', (req, res) => endpoints.get_game_info(req, res, chatrpg));
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
    app.post('/move_object_from_bag_to_inventory', (req, res) => endpoints.move_object_from_bag_to_inventory(req, res, chatrpg));
    app.get('/get_inventory_page', (req, res) => endpoints.get_inventory_page(req, res, chatrpg));
    app.post('/move_object_from_inventory_to_bag', (req, res) => endpoints.move_object_from_inventory_to_bag(req, res, chatrpg));
    app.post('/product_purchase', (req, res) => endpoints.product_purchase(req, res, chatrpg, twitchExtentionSecret));
    app.post('/claim_object', (req, res) => endpoints.claim_object(req, res, chatrpg));
    app.post('/updateGame', (req, res) => endpoints.updateGame(req, res, chatrpg));
    app.post('/useItem', (req, res) => endpoints.useItem(req, res, chatrpg));
    app.post('/reset_account', (req, res) => endpoints.resetAccount(req, res, chatrpg));
    app.post('/refresh_daily_shop', (req, res) => endpoints.refreshDailyShop(req, res, chatrpg));
    app.post('/sell', (req, res) => endpoints.sell(req, res, chatrpg));
    app.post('/daily_operations', (req, res) => endpoints.dailyOperations(req, res, chatrpg));
    
    const PORT = process.env.PORT || LOCAL_TEST_PORT;
    app.listen(PORT, () => {
        console.log(`Server running at port ${PORT}`);
    });
}

async function initialization() {
    
    let dataSource;
    if(process.env.LS_DATA_SOURCE === 'memory') {
        dataSource = new MemoryBackedDataSource();

        if(process.env.LS_MEMORY_SAMPLE_DATA) {
            const sampleData = require(process.env.LS_MEMORY_SAMPLE_DATA);
            await dataSource.initializeDataSource(sampleData);    
        }
        else {
            await dataSource.initializeDataSource();
        }
    }
    else {
        dataSource = new FirebaseDataSource();
        await dataSource.initializeDataSource();
    }

    if(process.env.LS_TWITCH_EXTENTION_SECRET) {
        twitchExtentionSecret = process.env.LS_TWITCH_EXTENTION_SECRET;
    }
    else {
        const adminConfigSnap = await dataSource.collection('configs').doc('admin').get();
        
        if(adminConfigSnap.exists && adminConfigSnap.data()) {
            twitchExtentionSecret = adminConfigSnap.data().twitchExtentionSecret;
        }
    }

    if(!twitchExtentionSecret && process.env.NODE_ENV !== 'development') {
        console.warn("Unable to set extension secret.");
    }

    return dataSource;
}

function main () {
    initialization().then(dataSource => {
        startServer(dataSource);
    });
}

main();