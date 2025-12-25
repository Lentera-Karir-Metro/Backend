// File: src/routes/userManagementRoutes.js
/**
 * @fileoverview Definisi rute untuk Manajemen User (CRUD, Deaktivasi, Enroll Manual).
 * Semua rute dalam file ini dilindungi dan hanya dapat diakses oleh Admin.
 * Rute diakses dengan prefix /api/v1/admin.
 */
const express = require('express');
const router = express.Router();

// Impor controller yang menangani logika manajemen user
const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  deactivateUser,
  triggerPasswordReset,
  manualEnrollUser,
  getUserEnrollments,
} = require('../controllers/userManagementController');

// Impor middleware otorisasi
const { protect, isAdmin } = require('../middlewares/authMiddleware');

// --- Pemasangan Middleware Global ---
/**
 * Lindungi SEMUA rute yang didefinisikan di bawah ini.
 * Akses dibatasi hanya untuk User dengan role 'admin'.
 */
router.use(protect);
router.use(isAdmin);

// --- Definisi Rute ---

/**
 * @method GET
 * @route /users
 * @description Mengambil daftar semua user di database lokal (MySQL).
 */
router.get('/users', getAllUsers);

/**
 * @method POST
 * @route /users
 * @description Membuat user baru (Admin Panel).
 */
router.post('/users', createUser);

/**
 * @method PUT
 * @route /users/:id
 * @description Memperbarui data user (misal: username untuk sertifikat).
 */
router.put('/users/:id', updateUser);

/**
 * @method DELETE
 * @route /users/:id
 * @description Menghapus user secara permanen (Hard Delete).
 */
router.delete('/users/:id', deleteUser);

/**
 * @method POST
 * @route /users/:id/deactivate
 * @description Menonaktifkan user secara sinkron (MySQL + Supabase ban).
 */
router.post('/users/:id/deactivate', deactivateUser);

/**
 * @method POST
 * @route /users/:id/reset-password
 * @description Memicu pengiriman link reset password ke user melalui API Supabase Admin.
 */
router.post('/users/:id/reset-password', triggerPasswordReset);

/**
 * @method POST
 * @route /users/:id/enroll
 * @description Mendaftarkan user ke Learning Path secara manual (oleh Admin).
 */
router.post('/users/:id/enroll', manualEnrollUser);

/**
 * @method GET
 * @route /users/:id/enrollments
 * @description Mengambil semua enrollment user beserta detail learning path.
 */
router.get('/users/:id/enrollments', getUserEnrollments);

module.exports = router;