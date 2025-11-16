// File: src/routes/courseModuleRoutes.js
const express = require('express');
const router = express.Router();

// Impor controller
const {
  createCourse,
  updateCourse,
  deleteCourse,
  reorderCourses
} = require('../controllers/courseController');

const {
  createModule,
  updateModule,
  deleteModule,
  reorderModules
} = require('../controllers/moduleController');

// Impor middleware
const { protect, isAdmin } = require('../middlewares/authMiddleware');

// Lindungi semua rute di file ini dengan middleware admin
router.use(protect);
router.use(isAdmin);

// --- Rute untuk Course ---

// POST /api/v1/admin/learning-paths/:lp_id/courses
router.post('/learning-paths/:lp_id/courses', createCourse);

// POST /api/v1/admin/learning-paths/:lp_id/reorder-courses
router.post('/learning-paths/:lp_id/reorder-courses', reorderCourses);

// PUT /api/v1/admin/courses/:id
router.put('/courses/:id', updateCourse);

// DELETE /api/v1/admin/courses/:id
router.delete('/courses/:id', deleteCourse);

// --- Rute untuk Module (Akan kita tambahkan di Langkah 22) ---
//POST /api/v1/admin/courses/:course_id/modules
router.post('/courses/:course_id/modules', createModule);

// POST /api/v1/admin/courses/:course_id/reorder-modules
router.post('/courses/:course_id/reorder-modules', reorderModules);

// PUT /api/v1/admin/modules/:id
router.put('/modules/:id', updateModule);

// DELETE /api/v1/admin/modules/:id
router.delete('/modules/:id', deleteModule);

module.exports = router;