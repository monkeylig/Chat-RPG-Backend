const https = require('https');
const fs = require('fs');
const express = require('express');

const ChatRPG = require('./chat-rpg/chat-rpg');
const FirebaseDataSource = require('./data-source/firebase-data-source');
const utility = require('./utility');

const dataSourceFileName = 'chat-rpg-data-source.json';

const Headers = {
    Platform: 'chat-rpg-platform'
}

function setStandardHeaders(res) {
    res.set('Access-Control-Allow-Origin', '*');
}

function internalErrorCatch(req, res, error) {
    res.status(500);
    responce.message = error.message;
    responce.errorCode = 0;
    res.send(JSON.stringify(responce));
}

function startServer(dataSource) {
    console.log('starting server');

    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
    const port = 3000;

    const chatrpg = new ChatRPG(dataSource);

    const options = {
        key: fs.readFileSync('yourdomain.key'),
        cert: fs.readFileSync('domain.crt')
      };

    app.get('/', (req, res) => {
        res.set('Access-Control-Allow-Origin', '*');
        res.status(200);
        res.send('Hello World!')
    });

    app.get('/get_starting_avatars', (req, res) => {
        setStandardHeaders(res);
        
        chatrpg.getStartingAvatars().then((avatars) => {
            res.status(200);
            res.send(JSON.stringify(avatars));
        });
    });

    app.options('/create_new_player', (req, res) => {
        setStandardHeaders(res);
        res.set('Access-Control-Allow-Methods', '*');
        res.set('Access-Control-Allow-Headers', '*');
        res.status(200);
        res.send('OK');
    });

    app.put('/create_new_player', (req, res) => {
        setStandardHeaders(res);
        let responce = {message: ''};

        const payloadParams = [
            {name: 'name', type: 'string'},
            {name: 'playerId', type: 'string'},
            {name: 'avatar', type: 'string'}
        ];
        
        if(!utility.validatePayloadParameters(req.body, payloadParams))
        {
            res.status(400);
            responce.message = 'Data in payload malformed';
            responce.errorCode = 1;
            res.send(JSON.stringify(responce));
            return;
        }

        if(!req.query.hasOwnProperty('platform'))
        {
            res.status(400);
            responce.message = 'missing query string "platform"';
            responce.errorCode = 2;
            res.send(JSON.stringify(responce));
            return;
        }

        chatrpg.addNewPlayer(req.body.name, req.body.avatar, req.body.playerId, req.query.platform)
        .then(succeeded => {
            if(succeeded) {
                res.status(200);
                responce.message = "OK";
                res.send(JSON.stringify(responce));
            }
        }).catch(error => {
            if(error.message == ChatRPG.Errors.playerExists) {
                res.status(400);
                responce.message = "A player with the provided ID already exsists";
                responce.errorCode = 2;
                res.send(JSON.stringify(responce));
            }
            else {
                res.status(500);
                responce.message = error.message;
                responce.errorCode = 0;
                res.send(JSON.stringify(responce));
            }
        });
    });

    app.get('/get_player', (req, res) => {
        setStandardHeaders(res);
        let responce = {message: ''};
        
        const payloadParams = [
            {name: 'platform', type: 'string'},
            {name: 'playerId', type: 'string'}
        ];

        if(!utility.validatePayloadParameters(req.query, payloadParams))
        {
            res.status(400);
            responce.message = 'missing query string keys';
            responce.errorCode = 1;
            res.send(JSON.stringify(responce));
            return;
        }

        chatrpg.findPlayerById(req.query.playerId, req.query.platform)
        .then(player => {
            res.status(200);
            res.send(JSON.stringify(player));
        })
        .catch(error => {
            res.status(500);
            responce.message = error.message;
            responce.errorCode = 0;
            res.send(JSON.stringify(responce));
        });
    });

    app.post('/join_game', (req, res) => {
        setStandardHeaders(res);
        let responce = {message: ''};

        const queryParams = [
            {name: 'playerId', type: 'string'},
            {name: 'gameId', type: 'string'},
        ];
        
        if(!utility.validatePayloadParameters(req.query, queryParams))
        {
            res.status(400);
            responce.message = 'missing query string keys';
            responce.errorCode = 1;
            res.send(JSON.stringify(responce));
            return;
        }

        if(!req.header(Headers.Platform)) {
            res.status(400);
            responce.message = 'missing platform header';
            responce.errorCode = 1;
            res.send(JSON.stringify(responce));
            return;
        }

        chatrpg.joinGame(req.query.playerId, req.query.gameId, req.header(Headers.Platform))
        .then(gameState => {
            res.status(200);
            res.send(JSON.stringify(gameState));

        }, (error) => {internalErrorCatch(req, res, error);});
    });

    let server = https.createServer(options, app);

    server.listen(port, () => {
        console.log(`Server running at port ${port}`)
    });
}

async function initialization() {
    const dataSource = new FirebaseDataSource();
    await dataSource.initializeDataSource(dataSourceFileName);
    return dataSource;
}

function main () {
    initialization().then(dataSource => {
        startServer(dataSource);
    });
}

main();