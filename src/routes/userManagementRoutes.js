// File: src/routes/userManagementRoutes.js
const express = require('express');
const router = express.Router();

// Impor controller
const {
  getAllUsers,
  updateUser,
  deactivateUser,
  triggerPasswordReset,
  manualEnrollUser,
} = require('../controllers/userManagementController');

// Impor middleware
const { protect, isAdmin } = require('../middlewares/authMiddleware');

// Lindungi semua rute di file ini dengan middleware admin
router.use(protect);
router.use(isAdmin);

// Definisikan rute

// /api/v1/admin/users
router.get('/users', getAllUsers);

// /api/v1/admin/users/:id
router.put('/users/:id', updateUser);

// /api/v1/admin/users/:id/deactivate
router.post('/users/:id/deactivate', deactivateUser);

// /api/v1/admin/users/:id/reset-password
router.post('/users/:id/reset-password', triggerPasswordReset);

// /api/v1/admin/users/:id/enroll
router.post('/users/:id/enroll', manualEnrollUser);

module.exports = router;