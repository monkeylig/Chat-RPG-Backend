const https = require('https');
const fs = require('fs');

//process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0" // Avoids DEPTH_ZERO_SELF_SIGNED_CERT error for self-signed certs
const options = {
  host: 'https://localhost:3000',
  path: '/create_new_player',
  method: 'PUT',

  rejectUnhauthorized : false
};

const body = JSON.stringify({msg: 'hello'});

const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);

  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.log("error occured")
  console.error(error);
});

req.write(body);
req.end();
