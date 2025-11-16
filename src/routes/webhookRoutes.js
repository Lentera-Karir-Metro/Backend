// File: src/routes/webhookRoutes.js
/**
 * @fileoverview Definisi rute untuk Webhook (Server-to-Server).
 * Rute ini harus tetap tidak terproteksi oleh middleware otentikasi
 * karena dipanggil oleh server Midtrans atau Supabase, bukan oleh frontend.
 * Rute diakses dengan prefix /api/v1.
 */
const express = require('express');
const router = express.Router();

// Impor controller yang menangani logika aktivasi/sinkronisasi
const {
  handleMidtransNotification,
  handleSupabaseUserDelete,
} = require('../controllers/webhookController');

// --- Pemasangan Middleware (TIDAK ADA) ---
// * PENTING: JANGAN pasang middleware 'protect' atau 'isAdmin' di sini.
// * Keamanan dilakukan melalui verifikasi Server Key Midtrans/Secret Key Supabase di Controller.

/**
 * @method POST
 * @route /webhooks/midtrans
 * @description Menerima notifikasi status pembayaran dari Midtrans. 
 * Memproses verifikasi dan meng-enroll user ke Learning Path.
 */
router.post('/webhooks/midtrans', handleMidtransNotification);

/**
 * @method POST
 * @route /webhooks/supabase/user-deleted
 * @description Menerima notifikasi penghapusan user dari Supabase Auth.
 * Memicu penghapusan user terkait di database MySQL.
 */
router.post('/webhooks/supabase/user-deleted', handleSupabaseUserDelete);

module.exports = router;