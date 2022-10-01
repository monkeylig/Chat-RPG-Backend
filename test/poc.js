const https = require('https');
const fs = require('fs');

//process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0" // Avoids DEPTH_ZERO_SELF_SIGNED_CERT error for self-signed certs
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/',
  method: 'GET',
  ca: fs.readFileSync('domain.crt'),
  rejectUnhauthorized : false
};

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

req.end();
