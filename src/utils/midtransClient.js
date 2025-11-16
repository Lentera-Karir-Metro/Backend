// File: src/utils/midtransClient.js
const midtransClient = require('midtrans-client');

// Gunakan CoreApi untuk verifikasi notifikasi
const coreApi = new midtransClient.CoreApi({
  isProduction: false, // Set 'true' saat production
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// Gunakan Snap untuk membuat sesi pembayaran
const snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

module.exports = { coreApi, snap };