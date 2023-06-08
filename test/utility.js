const https = require('https');

function backendCall(path, method, payload = null, headers = {}) {
    const netPromise = new Promise((resolve, reject) => {
        let body = '';
        if(payload)
        {
            body = JSON.stringify(payload);
            headers['Content-Type'] = 'application/json';
            headers['Content-Length'] = Buffer.byteLength(body);
        }

        const options = {
            host: 'localhost',
            port: 3000,
            method: method,
            path: encodeURI(path),
            headers: headers
        };

        const req = https.request(options, res => {
    
            res.on('data', d => {
                if(res.statusCode != 200) {
                    reject({serverError: true, responce: res, data: d});
                }
                else {
                    resolve(d);
                }
            });
        });
        
        req.on('error', error => {
            console.error(error);
            reject({serverError: false, message: error});
        });
        
        if(payload) {
            req.write(body);
        }
        req.end();

    });

    return netPromise;
}

function fail(testName) {
    console.error(testName.padEnd(40, '!') + "failed");
}

function pass(testName) {
    console.error(testName.padEnd(40) + " passed");
}

function genId() {
    return `id${Math.floor(Math.random() * 1000000).toString()}`;
}

module.exports = {backendCall, pass, fail, genId};