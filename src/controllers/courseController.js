// File: src/controllers/courseController.js
/**
 * @fileoverview Controller untuk mengelola entitas Course (CRUD dan reordering).
 * Controller ini hanya diakses oleh Admin.
 */
const db = require('../../models');
const Course = db.Course;
const LearningPath = db.LearningPath;
// Impor sequelize untuk menjalankan transaksi database (diperlukan untuk reordering)
const { sequelize } = require('../../models'); 

/**
 * @function createCourse
 * @description Membuat Course baru dan secara otomatis menentukan sequence_order.
 * @route POST /api/v1/admin/learning-paths/:lp_id/courses
 *
 * @param {object} req - Objek request (params: lp_id, body: { title, description })
 * @param {object} res - Objek response
 * @returns {object} Course yang baru dibuat.
 */
const createCourse = async (req, res) => {
  const { title, description } = req.body;
  const { lp_id } = req.params; // Ambil ID learning path dari URL

  if (!title) {
    return res.status(400).json({ message: 'Title wajib diisi.' });
  }

  try {
    // 1. Cek apakah learning path-nya ada
    const learningPath = await LearningPath.findByPk(lp_id);
    if (!learningPath) {
      return res.status(404).json({ message: 'Learning Path tidak ditemukan.' });
    }

    // 2. Hitung sequence_order berikutnya
    const lastCourse = await Course.findOne({
      where: { learning_path_id: lp_id },
      order: [['sequence_order', 'DESC']],
    });

    // Tentukan order baru: 1 jika belum ada course, atau +1 dari order terakhir
    const nextOrder = lastCourse ? lastCourse.sequence_order + 1 : 1;

    // 3. Buat Course
    const newCourse = await Course.create({
      learning_path_id: lp_id,
      title,
      description: description || null,
      sequence_order: nextOrder,
    });

    return res.status(201).json(newCourse);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function updateCourse
 * @description Memperbarui Course berdasarkan ID-nya.
 * @route PUT /api/v1/admin/courses/:id
 *
 * @param {object} req - Objek request (params: id, body: { title, description })
 * @param {object} res - Objek response
 * @returns {object} Course yang sudah diperbarui.
 */
const updateCourse = async (req, res) => {
  const { title, description } = req.body;
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course tidak ditemukan.' });
    }

    course.title = title || course.title;
    course.description = description || course.description;

    await course.save();
    return res.status(200).json(course);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function deleteCourse
 * @description Menghapus Course berdasarkan ID-nya. Karena relasi CASCADE, 
 * semua Modul di dalamnya akan ikut terhapus.
 * @route DELETE /api/v1/admin/courses/:id
 *
 * @param {object} req - Objek request (params: id)
 * @param {object} res - Objek response
 * @returns {object} Pesan sukses.
 */
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course tidak ditemukan.' });
    }

    await course.destroy();
    return res.status(200).json({ message: 'Course berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function reorderCourses
 * @description Memperbarui sequence_order semua course di dalam satu Learning Path 
 * berdasarkan urutan yang diberikan oleh frontend (fitur drag-and-drop).
 * @route POST /api/v1/admin/learning-paths/:lp_id/reorder-courses
 *
 * @param {object} req - Objek request (params: lp_id, body: { course_ids: string[] })
 * @param {object} res - Objek response
 * @returns {object} Pesan sukses.
 */
const reorderCourses = async (req, res) => {
  const { lp_id } = req.params;
  const { course_ids } = req.body; // Menerima array ID kustom Course

  if (!Array.isArray(course_ids) || course_ids.length === 0) {
    return res.status(400).json({ message: 'course_ids harus berupa array.' });
  }

  // Mulai transaksi database untuk memastikan semua update berhasil atau tidak sama sekali
  const t = await sequelize.transaction(); 

  try {
    // 1. Buat array Promise untuk update sequence_order setiap Course
    const updatePromises = course_ids.map((id, index) => {
      return Course.update(
        { sequence_order: index + 1 }, // Set urutan baru berdasarkan index array (+1)
        { 
          where: { 
            id: id,
            learning_path_id: lp_id // Pastikan Course tersebut memang milik Learning Path ini
          },
          transaction: t, // Jalankan dalam transaksi
        }
      );
    });

    // 2. Tunggu semua operasi update selesai
    await Promise.all(updatePromises); 

    // 3. Konfirmasi (commit) transaksi
    await t.commit(); 

    return res.status(200).json({ message: 'Urutan course berhasil diperbarui.' });

  } catch (err) {
    // Batalkan (rollback) transaksi jika ada error
    await t.rollback(); 
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = {
  createCourse,
  updateCourse,
  deleteCourse,
  reorderCourses,
};