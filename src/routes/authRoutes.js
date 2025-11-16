// File: src/routes/authRoutes.js
/**
 * @fileoverview Definisi rute untuk Autentikasi dan Sinkronisasi User.
 * Rute ini diakses dengan prefix /api/v1/auth.
 */
const express = require('express');
const router = express.Router();

// Impor controller yang menangani logika sinkronisasi
const { syncUser } = require('../controllers/authController');

/**
 * @description Mendefinisikan endpoint untuk proses sinkronisasi.
 * @method POST
 * @route /sync
 */
router.post('/sync', syncUser); // Endpoint krusial untuk sinkronisasi Supabase ke MySQL

module.exports = router;