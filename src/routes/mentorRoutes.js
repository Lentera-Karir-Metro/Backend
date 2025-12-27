// File: src/routes/mentorRoutes.js
/**
 * @fileoverview Definisi rute untuk manajemen Mentor.
 * Semua rute dalam file ini dilindungi dan hanya dapat diakses oleh Admin.
 */
const express = require('express');
const router = express.Router();

// Impor controller untuk Mentor
const {
  getMentors,
  getMentorById,
  updateMentor
} = require('../controllers/mentorController');

// Impor middleware otorisasi
const { protect, isAdmin } = require('../middlewares/authMiddleware');

// --- Pemasangan Middleware Global ---
router.use(protect);
router.use(isAdmin);

// --- Rute untuk Mentor ---

/**
 * @method GET
 * @route /mentors
 * @description Mengambil semua mentor (derived dari courses)
 */
router.get('/mentors', getMentors);

/**
 * @method GET
 * @route /mentors/:id
 * @description Mengambil detail mentor dan courses yang diajar
 */
router.get('/mentors/:id', getMentorById);

/**
 * @method PUT
 * @route /mentors/:id
 * @description Update mentor info di semua courses
 */
router.put('/mentors/:id', updateMentor);

module.exports = router;
