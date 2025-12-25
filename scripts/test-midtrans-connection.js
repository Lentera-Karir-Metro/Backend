const midtransClient = require('midtrans-client');
require('dotenv').config();

const serverKey = process.env.MIDTRANS_SERVER_KEY;
const clientKey = process.env.MIDTRANS_CLIENT_KEY;
const isProduction = (process.env.MIDTRANS_IS_PRODUCTION === 'true');

console.log('Config:', { serverKey: serverKey ? '***' : 'MISSING', isProduction });

const coreApi = new midtransClient.CoreApi({
  isProduction,
  serverKey,
  clientKey
});

// Coba ping API Midtrans dengan order_id sembarang (yang pasti tidak ada)
// Kita harapkan 404, bukan ENOTFOUND
const testConnection = async () => {
  try {
    console.log('Testing connection to Midtrans Core API...');
    const status = await coreApi.transaction.status('TEST-CONNECTION-123');
    console.log('Response:', status);
  } catch (err) {
    console.log('Error Code:', err.code);
    console.log('Error Message:', err.message);
    if (err.httpStatusCode) {
        console.log('HTTP Status:', err.httpStatusCode);
    }
  }
};

testConnection();
