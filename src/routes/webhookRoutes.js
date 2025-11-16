// File: src/routes/webhookRoutes.js
const express = require('express');
const router = express.Router();

// Impor controller
const {
  handleMidtransNotification,
  handleSupabaseUserDelete,
} = require('../controllers/webhookController');

// Rute untuk Midtrans
router.post('/webhooks/midtrans', handleMidtransNotification);

// Rute untuk Supabase
router.post('/webhooks/supabase/user-deleted', handleSupabaseUserDelete);

module.exports = router;