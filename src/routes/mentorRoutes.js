// File: src/routes/mentorRoutes.js
/**
 * @fileoverview Definisi rute untuk manajemen Mentor.
 * Semua rute dalam file ini dilindungi dan hanya dapat diakses oleh Admin.
 */
const express = require('express');
const router = express.Router();

// Impor controller untuk Mentor
const {
  getAllMentors,
  getMentorById,
  createMentor,
  updateMentor,
  deleteMentor,
} = require('../controllers/mentorController');

// Impor middleware otorisasi
const { protect, isAdmin } = require('../middlewares/authMiddleware');

// Impor middleware upload
const { validateFile } = require('../middlewares/uploadMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// --- Pemasangan Middleware Global ---
router.use(protect);
router.use(isAdmin);

// --- Rute untuk Mentor ---

/**
 * @method GET
 * @route /mentors
 * @description Mengambil semua mentor dengan pagination
 */
router.get('/mentors', getAllMentors);

/**
 * @method GET
 * @route /mentors/:id
 * @description Mengambil detail mentor berdasarkan ID
 */
router.get('/mentors/:id', getMentorById);

/**
 * @method POST
 * @route /mentors
 * @description Membuat mentor baru
 */
router.post('/mentors', upload.single('photo'), validateFile, createMentor);

/**
 * @method PUT
 * @route /mentors/:id
 * @description Update mentor info
 */
router.put('/mentors/:id', upload.single('photo'), validateFile, updateMentor);

/**
 * @method DELETE
 * @route /mentors/:id
 * @description Hapus mentor
 */
router.delete('/mentors/:id', deleteMentor);

module.exports = router;
