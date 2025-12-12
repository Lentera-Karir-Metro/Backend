// File: src/routes/authRoutes.js
/**
 * @fileoverview Definisi rute untuk Autentikasi dan Sinkronisasi User.
 * Rute ini diakses dengan prefix /api/v1/auth.
 */
const express = require('express');
const router = express.Router();
const { register, verifyEmail, login, googleLogin, forgotPassword, refreshToken } = require('../controllers/authController');

router.post('/register', register);
router.get('/verify-email', verifyEmail);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/refresh-token', refreshToken);

module.exports = router;