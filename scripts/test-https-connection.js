const https = require('https');
require('dotenv').config();

const hostname = 'api.sandbox.midtrans.com';
const path = '/v2/TEST-CONNECTION-123/status';
const serverKey = process.env.MIDTRANS_SERVER_KEY;

console.log(`Testing HTTPS connection to ${hostname}...`);
console.log(`Server Key Length: ${serverKey ? serverKey.length : 0}`);

const options = {
  hostname: hostname,
  port: 443,
  path: path,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Basic ' + Buffer.from(serverKey + ':').toString('base64')
  }
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
