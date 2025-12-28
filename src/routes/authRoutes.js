// File: src/routes/authRoutes.js
/**
 * @fileoverview Definisi rute untuk Autentikasi dan Sinkronisasi User.
 * Rute ini diakses dengan prefix /api/v1/auth.
 */
const express = require('express');
const router = express.Router();
const { register, verifyEmail, login, forgotPassword, resetPassword, refreshToken, getCurrentUser, checkUserStatus } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/register', register);
router.get('/verify-email', verifyEmail);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh-token', refreshToken);
router.get('/me', protect, getCurrentUser);
router.get('/check-status', protect, checkUserStatus);

module.exports = router;