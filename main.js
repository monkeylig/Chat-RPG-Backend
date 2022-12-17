const https = require('https');
const fs = require('fs');
const express = require('express');

const chatrpg = require('./chat-rpg/chat-rpg')
const FileSystemDataSource = require('./data-source/file-system-data-source');

const dataSourceFileName = 'chat-rpg-data-source.json';

function setStandardHeaders(res) {
    res.set('Access-Control-Allow-Origin', '*');
}

function startServer(dataSource) {
    console.log('starting server');
    const app = express();
    app.use(express.json());
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
        avatars = chatrpg.getStartingAvatars(dataSource);
        res.status(200);
        res.send(JSON.stringify(avatars));
    });

    app.put('/create_new_player', (req, res) => {
        setStandardHeaders(res);
        console.log(req.body);
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
    })
}

main();