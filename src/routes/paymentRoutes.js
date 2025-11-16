// File: src/routes/paymentRoutes.js
/**
 * @fileoverview Definisi rute untuk inisiasi Pembayaran (Checkout) Midtrans.
 * Rute ini diakses dengan prefix /api/v1.
 */
const express = require('express');
const router = express.Router();
const { createCheckoutSession } = require('../controllers/paymentController');

// Impor middleware 'protect' untuk memastikan user sudah login
const { protect } = require('../middlewares/authMiddleware'); 

/**
 * @method POST
 * @route /payments/checkout
 * @description Membuat sesi transaksi Midtrans Snap.
 * Endpoint ini WAJIB melalui middleware 'protect' karena membutuhkan data user 
 * (user_id dan email) dari database lokal untuk metadata transaksi.
 */
router.post('/payments/checkout', protect, createCheckoutSession);

module.exports = router;