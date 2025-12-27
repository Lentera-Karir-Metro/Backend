// File: src/routes/courseModuleRoutes.js
/**
 * @fileoverview Definisi rute untuk manajemen konten Learning Path (Course dan Module).
 * Semua rute dalam file ini dilindungi dan hanya dapat diakses oleh Admin.
 * Rute diakses dengan prefix /api/v1/admin.
 */
const express = require('express');
const router = express.Router();

// Impor controller untuk Course
const {
  createCourse,
  updateCourse,
  deleteCourse,
  reorderCourses,
  getAllCourses,
  getCourseById,
  assignCourseToLearningPath
} = require('../controllers/courseController');

// Impor controller untuk Module
const {
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
  getModuleById,
  getModulesByCourse
} = require('../controllers/moduleController');

// Impor middleware otorisasi
const { protect, isAdmin } = require('../middlewares/authMiddleware');
const { uploadSingle, validateFile } = require('../middlewares/uploadMiddleware');

// --- Pemasangan Middleware Global ---
/**
 * Lindungi SEMUA rute yang didefinisikan di bawah ini.
 * User harus login (protect) dan memiliki role 'admin' (isAdmin).
 */
router.use(protect);
router.use(isAdmin);

// --- Rute untuk Course ---

/**
 * @method GET
 * @route /courses
 * @description Mengambil semua course (untuk dropdown/list).
 */
router.get('/courses', getAllCourses);

/**
 * @method GET
 * @route /courses/:id
 * @description Mengambil detail satu course
 */
router.get('/courses/:id', getCourseById);

/**
 * @method POST
 * @route /courses
 * @description Membuat Course baru (standalone, tidak langsung masuk learning path).
 */
router.post('/courses', uploadSingle.any(), validateFile, createCourse);

/**
 * @method POST
 * @route /learning-paths/:lp_id/courses
 * @description Assign Course ke Learning Path tertentu.
 */
router.post('/learning-paths/:lp_id/courses', assignCourseToLearningPath);

/**
 * @method POST
 * @route /learning-paths/:lp_id/reorder-courses
 * @description Memperbarui urutan (sequence_order) Course (fitur drag-and-drop Admin).
 */
router.post('/learning-paths/:lp_id/reorder-courses', reorderCourses);

/**
 * @method PUT
 * @route /courses/:id
 * @description Memperbarui detail Course.
 */
router.put('/courses/:id', uploadSingle.any(), validateFile, updateCourse);

/**
 * @method DELETE
 * @route /courses/:id
 * @description Menghapus Course (CASCADE DELETE ke semua Modul di dalamnya).
 */
router.delete('/courses/:id', deleteCourse);

// --- Rute untuk Module ---

/**
 * @method GET
 * @route /courses/:course_id/modules
 * @description Mengambil semua modules dalam satu course
 */
router.get('/courses/:course_id/modules', getModulesByCourse);

/**
 * @method POST
 * @route /courses/:course_id/modules
 * @description Membuat Module baru di dalam Course tertentu.
 * Upload file (video/ebook) dengan field "file" (bisa multiple)
 */
router.post(
  '/courses/:course_id/modules',
  uploadSingle.array('file'), // Support multiple files upload
  validateFile,
  createModule
);

/**
 * @method GET
 * @route /modules/:id
 * @description Ambil detail satu Module (Admin)
 */
router.get('/modules/:id', getModuleById);

/**
 * @method POST
 * @route /courses/:course_id/reorder-modules
 * @description Memperbarui urutan (sequence_order) Module (fitur drag-and-drop Admin).
 */
router.post('/courses/:course_id/reorder-modules', reorderModules);

/**
 * @method PUT
 * @route /modules/:id
 * @description Memperbarui detail Module.
 * Upload file (video/ebook) dengan field "file"
 */
router.put(
  '/modules/:id',
  uploadSingle.single('file'),
  validateFile,
  updateModule
);

/**
 * @method DELETE
 * @route /modules/:id
 * @description Menghapus Module.
 */
router.delete('/modules/:id', deleteModule);

/**
 * @method DELETE
 * @route /courses/:course_id/modules/:id
 * @description Menghapus Module (alternative route).
 */
router.delete('/courses/:course_id/modules/:id', deleteModule);

module.exports = router;