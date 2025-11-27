// File: src/utils/midtransClient.js
/**
 * @fileoverview Utilitas untuk menginisialisasi client Midtrans.
 * Menyediakan instance CoreApi dan Snap, serta helper function dengan logging yang lebih baik.
 */
const midtransClient = require('midtrans-client');
require('dotenv').config(); // Pastikan env terbaca

// Ambil konfigurasi dari environment
const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
const clientKey = process.env.MIDTRANS_CLIENT_KEY || '';
const isProduction = (process.env.MIDTRANS_IS_PRODUCTION === 'true');

// Log configuration status untuk debugging (Hanya muncul di server log)
console.log('\n[Midtrans Config]');
console.log(`  serverKey: ${serverKey ? '✓ Set (...' + serverKey.slice(-5) + ')' : '✗ NOT SET'}`);
console.log(`  clientKey: ${clientKey ? '✓ Set' : '✗ NOT SET'}`);
console.log(`  isProduction: ${isProduction}\n`);

if (!serverKey) {
  console.error('[CRITICAL] MIDTRANS_SERVER_KEY is not configured in .env file!');
}

// Inisialisasi client Midtrans
const coreApi = new midtransClient.CoreApi({
  isProduction,
  serverKey,
  clientKey
});

const snap = new midtransClient.Snap({
  isProduction,
  serverKey,
  clientKey
});

/**
 * Wrapper helper untuk createTransaction yang memberikan error lebih informatif
 */
async function createSnapTransaction(params) {
  if (!serverKey) {
    throw new Error('MIDTRANS_SERVER_KEY is missing. Check your .env file.');
  }
  try {
    console.log('[Midtrans] Creating Snap transaction for order:', params.transaction_details?.order_id);
    return await snap.createTransaction(params);
  } catch (err) {
    // Perkaya error untuk debugging
    const errorMsg = `[Midtrans Snap Error] ${err.message}. Response: ${JSON.stringify(err.apiResponse || err)}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 * Wrapper helper untuk verifikasi notifikasi Midtrans
 */
async function verifyCoreNotification(notificationBody) {
  if (!serverKey) {
    throw new Error('MIDTRANS_SERVER_KEY is missing. Check your .env file.');
  }
  try {
    console.log('[Midtrans] Verifying notification for order:', notificationBody.order_id || 'unknown');
    return await coreApi.transaction.notification(notificationBody);
  } catch (err) {
    const errorMsg = `[Midtrans CoreApi Error] ${err.message}. Response: ${JSON.stringify(err.apiResponse || err)}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}

module.exports = { coreApi, snap, createSnapTransaction, verifyCoreNotification };