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

/**
 * Wrapper helper untuk cancel transaksi Midtrans
 */
async function cancelMidtransTransaction(orderId) {
  if (!serverKey) {
    throw new Error('MIDTRANS_SERVER_KEY is missing. Check your .env file.');
  }
  try {
    console.log('[Midtrans] Canceling transaction:', orderId);
    return await coreApi.transaction.cancel(orderId);
  } catch (err) {
    // Jika transaksi sudah expired atau tidak ditemukan, tidak perlu throw error
    if (err.ApiResponse?.status_code === '404' || err.message.includes('404')) {
      console.log(`[Midtrans] Transaction ${orderId} not found (already expired/cancelled)`);
      return { status_code: '404', status_message: 'Transaction not found' };
    }
    console.warn(`[Midtrans] Cancel error for ${orderId}:`, err.message);
    // Return error tapi jangan throw, biar proses checkout tetap lanjut
    return { status_code: 'error', status_message: err.message };
  }
}

/**
 * Helper manual untuk cek status transaksi menggunakan native fetch
 * Menggantikan coreApi.transaction.status yang bermasalah dengan koneksi
 */
async function getTransactionStatus(orderId) {
  if (!serverKey) throw new Error('MIDTRANS_SERVER_KEY is missing.');

  const baseUrl = isProduction 
    ? 'https://api.midtrans.com' 
    : 'https://api.sandbox.midtrans.com';
    
  const url = `${baseUrl}/v2/${orderId}/status`;
  const authString = Buffer.from(serverKey + ':').toString('base64');

  console.log(`[Midtrans] Checking status via fetch: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      }
    });

    if (!response.ok) {
      // Handle 404 specifically
      if (response.status === 404) {
        const err = new Error('Transaction not found');
        err.httpStatusCode = 404;
        throw err;
      }
      throw new Error(`Midtrans API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Midtrans] Fetch Status Error:', error.message);
    throw error;
  }
}

module.exports = { 
  coreApi, 
  snap, 
  createSnapTransaction, 
  verifyCoreNotification, 
  cancelMidtransTransaction,
  getTransactionStatus 
};