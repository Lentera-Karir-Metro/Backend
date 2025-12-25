// File: src/routes/paymentRoutes.js
/**
 * @fileoverview Definisi rute untuk inisiasi Pembayaran (Checkout) Midtrans.
 * Rute ini diakses dengan prefix /api/v1.
 */
const express = require('express');
const router = express.Router();
const { createCheckoutSession, getAllTransactions } = require('../controllers/paymentController');
const { checkPaymentStatus, syncAllPendingPayments } = require('../controllers/paymentStatusController');

// Impor middleware 'protect' untuk memastikan user sudah login
const { protect, isAdmin } = require('../middlewares/authMiddleware'); 

/**
 * @method GET
 * @route /admin/transactions
 * @description Mengambil semua data transaksi untuk Admin Panel.
 * @access Private/Admin
 */
router.get('/admin/transactions', protect, isAdmin, getAllTransactions);

/**
 * @method POST
 * @route /payments/checkout
 * @description Membuat sesi transaksi Midtrans Snap.
 * Endpoint ini WAJIB melalui middleware 'protect' karena membutuhkan data user 
 * (user_id dan email) dari database lokal untuk metadata transaksi.
 */
router.post('/payments/checkout', protect, createCheckoutSession);

/**
 * @method GET
 * @route /payments/status/:order_id
 * @description Mengecek status pembayaran dan auto-sync jika sudah settlement
 */
router.get('/payments/status/:order_id', protect, checkPaymentStatus);

/**
 * @method POST
 * @route /payments/sync
 * @description Mensinkronkan semua pembayaran pending milik user
 */
router.post('/payments/sync', protect, syncAllPendingPayments);

module.exports = router;