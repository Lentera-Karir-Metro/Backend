// File: src/utils/midtransClient.js
/**
 * @fileoverview Utilitas untuk menginisialisasi client Midtrans.
 * Kita menggunakan dua jenis client untuk fungsi yang berbeda:
 * 1. CoreApi (untuk verifikasi webhook dan fitur backend lainnya).
 * 2. Snap (untuk membuat sesi pembayaran yang diakses oleh frontend).
 */
const midtransClient = require('midtrans-client');

/**
 * @const {midtransClient.CoreApi} coreApi
 * @description Inisialisasi CoreApi client. Digunakan untuk fitur backend seperti
 * verifikasi notifikasi (webhook) dan pengecekan status transaksi.
 */
const coreApi = new midtransClient.CoreApi({
  isProduction: false, // Disetel ke FALSE untuk Sandbox (Development)
  serverKey: process.env.MIDTRANS_SERVER_KEY, // Diambil dari .env
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

/**
 * @const {midtransClient.Snap} snap
 * @description Inisialisasi Snap client. Digunakan untuk membuat sesi pembayaran
 * yang mengembalikan token/redirect URL ke frontend.
 */
const snap = new midtransClient.Snap({
  isProduction: false, // Disetel ke FALSE untuk Sandbox (Development)
  serverKey: process.env.MIDTRANS_SERVER_KEY, // Diambil dari .env
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

module.exports = { coreApi, snap }; // Ekspor kedua client untuk digunakan di Controller