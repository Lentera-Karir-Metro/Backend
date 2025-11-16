// File: src/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { createCheckoutSession } = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware'); // Impor middleware 'protect'

// Rute ini HARUS dilindungi. User harus login untuk checkout.

// /api/v1/payments/checkout
router.post('/payments/checkout', protect, createCheckoutSession);

module.exports = router;