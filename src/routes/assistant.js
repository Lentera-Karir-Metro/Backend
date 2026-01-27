// File: Backend/src/routes/assistant.js
/**
 * @fileoverview Route untuk AI Assistant
 * Endpoint publik untuk mobile app dan web (tidak memerlukan autentikasi)
 */

const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistantController');

/**
 * @route POST /api/v1/assistant
 * @desc Generate AI response untuk user message
 * @access Public (tidak perlu login)
 * 
 * Body:
 * - message: string (required)
 * - model: string (optional)
 * - stream: boolean (optional, default: false)
 */
router.post('/', assistantController.handleAssistant);

/**
 * @route GET /api/v1/assistant
 * @desc Health check untuk assistant API
 * @access Public
 */
router.get('/', assistantController.healthCheck);

module.exports = router;
