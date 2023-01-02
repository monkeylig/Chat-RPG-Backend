const https = require('https');
const fs = require('fs');
const express = require('express');

const chatrpg = require('./chat-rpg/chat-rpg');
const FileSystemDataSource = require('./data-source/file-system-data-source');
const utility = require('./utility');

const dataSourceFileName = 'chat-rpg-data-source.json';

function setStandardHeaders(res) {
    res.set('Access-Control-Allow-Origin', '*');
}

function startServer(dataSource) {
    console.log('starting server');
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
    const port = 3000;

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
        
        chatrpg.getStartingAvatars(dataSource).then((avatars) => {
            res.status(200);
            res.send(JSON.stringify(avatars));
        });
    });

    app.put('/create_new_player', (req, res) => {
        setStandardHeaders(res);
        let responce = {message: ''};

        const payloadParams = [
            {name: 'name', type: 'string'},
            {name: 'twitchId', type: 'string'},
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

        chatrpg.addNewPlayer(dataSource, req.body.name, req.body.avatar, req.body.twitchId)
        .then(succeeded => {
            if(succeeded) {
                res.status(200);
                responce.message = "OK";
                res.send(JSON.stringify(responce));
            } else {
                res.status(400);
                responce.message = "A player with the provided Twitch ID already exsists";
                responce.errorCode = 2;
                res.send(JSON.stringify(responce));
            }
        }).catch(error => {
            res.status(500);
            responce.message = error.message;
            responce.errorCode = 0;
            res.send(JSON.stringify(responce));
        });
    });

    app.get('/get_player', (req,res) => {
        setStandardHeaders(res);
        if(!req.query.hasOwnProperty('twitchId'))
        {
            res.status(400);
            responce.message = 'missing query string "twitchId"';
            responce.errorCode = 0;
            res.send(JSON.stringify(responce));
            return;
        }

        chatrpg.findPlayerByTwitchId(dataSource, req.query.twitchId)
        .then(player => {
            res.status(200);
            res.send(JSON.stringify(player));
        });
    });

    let server = https.createServer(options, app);

    server.listen(port, () => {
        console.log(`Server running at port ${port}`)
    });
}

async function initialization() {
    const dataSource = new FileSystemDataSource();
    await dataSource.initializeDataSource(dataSourceFileName);
    return dataSource;
}

function main () {
    initialization().then(dataSource => {
        startServer(dataSource);
    });
}

main();