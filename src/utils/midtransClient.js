// File: src/utils/midtransClient.js
/**
 * @fileoverview Utilitas untuk menginisialisasi client Midtrans.
 * Kita menggunakan dua jenis client untuk fungsi yang berbeda:
 * 1. CoreApi (untuk verifikasi webhook dan fitur backend lainnya).
 * 2. Snap (untuk membuat sesi pembayaran yang diakses oleh frontend).
 */
const midtransClient = require('midtrans-client');

// Ambil konfigurasi dari environment
const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
const clientKey = process.env.MIDTRANS_CLIENT_KEY || '';
const isProduction = (process.env.MIDTRANS_IS_PRODUCTION === 'true') || false;

// Log configuration status untuk debugging
console.log('[Midtrans Config]');
console.log(`  serverKey: ${serverKey ? '✓ Set (' + serverKey.substring(0, 20) + '...)' : '✗ NOT SET'}`);
console.log(`  clientKey: ${clientKey ? '✓ Set' : '✗ NOT SET'}`);
console.log(`  isProduction: ${isProduction}`);

if (!serverKey) {
  console.error('[CRITICAL] MIDTRANS_SERVER_KEY is not configured in .env file!');
  console.error('Webhook dan Checkout akan gagal. Pastikan .env memiliki MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxx');
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

// Wrapper helper untuk createTransaction yang memberikan error lebih informatif
async function createSnapTransaction(params) {
  if (!serverKey) {
    const err = new Error(
      'MIDTRANS_SERVER_KEY is not configured. Add MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxx to your .env file'
    );
    err.status = 'CONFIG_ERROR';
    throw err;
  }
  try {
    console.log('[Midtrans] Creating Snap transaction for order:', params.transaction_details?.order_id);
    return await snap.createTransaction(params);
  } catch (err) {
    // Perkaya error untuk debugging
    const status = err && err.httpStatus ? err.httpStatus : undefined;
    const body = err && err.apiResponse ? err.apiResponse : (err && err.response ? err.response : undefined);
    
    const errorMsg = `[Midtrans Snap Error] HTTP ${status || 'unknown'}. ` +
      `Message: ${err.message}. ` +
      `Response: ${typeof body === 'string' ? body : JSON.stringify(body)}. ` +
      `Ensure MIDTRANS_SERVER_KEY in .env is correct and not expired.`;
    
    console.error(errorMsg);
    
    const e = new Error(errorMsg);
    e.original = err;
    e.status = status;
    e.apiResponse = body;
    throw e;
  }
}

// Wrapper helper untuk verifikasi notifikasi Midtrans
async function verifyCoreNotification(notificationBody) {
  if (!serverKey) {
    const err = new Error(
      'MIDTRANS_SERVER_KEY is not configured. Add MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxx to your .env file'
    );
    err.status = 'CONFIG_ERROR';
    throw err;
  }
  try {
    console.log('[Midtrans] Verifying notification for order:', notificationBody.order_id || 'unknown');
    return await coreApi.transaction.notification(notificationBody);
  } catch (err) {
    const status = err && err.httpStatus ? err.httpStatus : undefined;
    const body = err && err.apiResponse ? err.apiResponse : (err && err.response ? err.response : undefined);
    
    const errorMsg = `[Midtrans CoreApi Notification Error] HTTP ${status || 'unknown'}. ` +
      `Message: ${err.message}. ` +
      `Response: ${typeof body === 'string' ? body : JSON.stringify(body)}. ` +
      `Ensure MIDTRANS_SERVER_KEY in .env is correct and matches the transaction.`;
    
    console.error(errorMsg);
    
    const e = new Error(errorMsg);
    e.original = err;
    e.status = status;
    throw e;
  }
}

module.exports = { coreApi, snap, createSnapTransaction, verifyCoreNotification };