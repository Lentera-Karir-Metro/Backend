// File: src/controllers/courseController.js
const db = require('../../models');
const Course = db.Course;
const LearningPath = db.LearningPath;
const { sequelize } = require('../../models'); // Untuk transaksi

// @desc    Membuat Course baru di dalam Learning Path (Admin)
// @route   POST /api/v1/admin/learning-paths/:lp_id/courses
const createCourse = async (req, res) => {
  const { title, description } = req.body;
  const { lp_id } = req.params; // Ambil ID learning path dari URL

  if (!title) {
    return res.status(400).json({ message: 'Title wajib diisi.' });
  }

  try {
    // Cek apakah learning path-nya ada
    const learningPath = await LearningPath.findByPk(lp_id);
    if (!learningPath) {
      return res.status(404).json({ message: 'Learning Path tidak ditemukan.' });
    }

    // Hitung sequence_order berikutnya
    const lastCourse = await Course.findOne({
      where: { learning_path_id: lp_id },
      order: [['sequence_order', 'DESC']],
    });

    const nextOrder = lastCourse ? lastCourse.sequence_order + 1 : 1;

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

// @desc    Update Course (Admin)
// @route   PUT /api/v1/admin/courses/:id
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

// @desc    Hapus Course (Admin)
// @route   DELETE /api/v1/admin/courses/:id
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

// @desc    Mengubah urutan Course (Drag-and-drop)
// @route   POST /api/v1/admin/learning-paths/:lp_id/reorder-courses
const reorderCourses = async (req, res) => {
  const { lp_id } = req.params;
  const { course_ids } = req.body; // Menerima array [ "CR-AAA", "CR-CCC", "CR-BBB" ]

  if (!Array.isArray(course_ids) || course_ids.length === 0) {
    return res.status(400).json({ message: 'course_ids harus berupa array.' });
  }

  const t = await sequelize.transaction(); // Mulai transaksi database

  try {
    // Update sequence_order setiap course berdasarkan urutan di array
    const updatePromises = course_ids.map((id, index) => {
      return Course.update(
        { sequence_order: index + 1 }, // Urutan dimulai dari 1
        { 
          where: { 
            id: id,
            learning_path_id: lp_id // Pastikan hanya update course di path yg benar
          },
          transaction: t, // Jalankan dalam transaksi
        }
      );
    });

    await Promise.all(updatePromises); // Tunggu semua update selesai

    await t.commit(); // Konfirmasi transaksi

    return res.status(200).json({ message: 'Urutan course berhasil diperbarui.' });

  } catch (err) {
    await t.rollback(); // Batalkan transaksi jika ada error
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = {
  createCourse,
  updateCourse,
  deleteCourse,
  reorderCourses,
  // (GET /:id tidak kita buat karena sudah ada di getLearningPathById)
};