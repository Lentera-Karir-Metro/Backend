// File: src/routes/authRoutes.js
/**
 * @fileoverview Definisi rute untuk Autentikasi dan Sinkronisasi User.
 * Rute ini diakses dengan prefix /api/v1/auth.
 */
const express = require('express');
const router = express.Router();

// Impor controller yang menangani logika sinkronisasi dan refresh token
const { syncUser, refreshToken } = require('../controllers/authController');

/**
 * @method POST
 * @route /sync
 * @description Endpoint krusial untuk sinkronisasi data user dari Supabase ke MySQL setelah login/register.
 */
router.post('/sync', syncUser);

/**
 * @method POST
 * @route /refresh-token
 * @description Endpoint untuk memperbarui token sesi (opsional, jika tidak ditangani otomatis oleh frontend SDK).
 */
router.post('/refresh-token', refreshToken);

module.exports = router;