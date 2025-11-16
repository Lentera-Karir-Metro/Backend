// File: src/controllers/moduleController.js
const db = require('../../models');
const Module = db.Module;
const Course = db.Course;
const { sequelize } = require('../../models'); // Untuk transaksi

// @desc    Membuat Module baru di dalam Course (Admin)
// @route   POST /api/v1/admin/courses/:course_id/modules
const createModule = async (req, res) => {
  const { course_id } = req.params;
  const {
    title,
    module_type, // 'video', 'ebook', 'quiz'
    sequence_order,
    video_url,
    ebook_url,
    quiz_id,
    durasi_video_menit,
    estimasi_waktu_menit,
  } = req.body;

  if (!title || !module_type || !estimasi_waktu_menit) {
    return res.status(400).json({ message: 'Title, Module Type, dan Estimasi Waktu wajib diisi.' });
  }

  if (module_type === 'video' && !video_url) {
     return res.status(400).json({ message: 'Video URL wajib diisi untuk modul video.' });
  }

  if (module_type === 'ebook' && !ebook_url) {
     return res.status(400).json({ message: 'Ebook URL wajib diisi untuk modul ebook.' });
  }

  // (Kita akan tambahkan validasi quiz_id di langkah berikutnya)

  try {
    // Cek apakah course-nya ada
    const course = await Course.findByPk(course_id);
    if (!course) {
      return res.status(404).json({ message: 'Course tidak ditemukan.' });
    }

    // Hitung sequence_order berikutnya
    const lastModule = await Module.findOne({
      where: { course_id: course_id },
      order: [['sequence_order', 'DESC']],
    });

    const nextOrder = lastModule ? lastModule.sequence_order + 1 : 1;

    const newModule = await Module.create({
      course_id: course_id,
      title,
      module_type,
      sequence_order: nextOrder,
      video_url: module_type === 'video' ? video_url : null,
      ebook_url: module_type === 'ebook' ? ebook_url : null,
      quiz_id: module_type === 'quiz' ? quiz_id : null,
      durasi_video_menit: durasi_video_menit || null,
      estimasi_waktu_menit: parseInt(estimasi_waktu_menit),
    });

    return res.status(201).json(newModule);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// @desc    Update Module (Admin)
// @route   PUT /api/v1/admin/modules/:id
const updateModule = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    module_type,
    video_url,
    ebook_url,
    quiz_id,
    durasi_video_menit,
    estimasi_waktu_menit,
  } = req.body;

  try {
    const module = await Module.findByPk(id);
    if (!module) {
      return res.status(404).json({ message: 'Module tidak ditemukan.' });
    }

    // Update data
    module.title = title || module.title;
    module.module_type = module_type || module.module_type;
    module.video_url = module_type === 'video' ? video_url : null;
    module.ebook_url = module_type === 'ebook' ? ebook_url : null;
    module.quiz_id = module_type === 'quiz' ? quiz_id : null;
    module.durasi_video_menit = durasi_video_menit || module.durasi_video_menit;
    module.estimasi_waktu_menit = estimasi_waktu_menit || module.estimasi_waktu_menit;

    await module.save();
    return res.status(200).json(module);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// @desc    Hapus Module (Admin)
// @route   DELETE /api/v1/admin/modules/:id
const deleteModule = async (req, res) => {
  try {
    const module = await Module.findByPk(req.params.id);
    if (!module) {
      return res.status(404).json({ message: 'Module tidak ditemukan.' });
    }

    await module.destroy();
    return res.status(200).json({ message: 'Module berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// @desc    Mengubah urutan Module (Drag-and-drop)
// @route   POST /api/v1/admin/courses/:course_id/reorder-modules
const reorderModules = async (req, res) => {
  const { course_id } = req.params;
  const { module_ids } = req.body; // Menerima array [ "MD-AAA", "MD-CCC", "MD-BBB" ]

  if (!Array.isArray(module_ids) || module_ids.length === 0) {
    return res.status(400).json({ message: 'module_ids harus berupa array.' });
  }

  const t = await sequelize.transaction();

  try {
    const updatePromises = module_ids.map((id, index) => {
      return Module.update(
        { sequence_order: index + 1 }, // Urutan dimulai dari 1
        { 
          where: { 
            id: id,
            course_id: course_id // Pastikan hanya update modul di course yg benar
          },
          transaction: t,
        }
      );
    });

    await Promise.all(updatePromises);
    await t.commit();

    return res.status(200).json({ message: 'Urutan modul berhasil diperbarui.' });

  } catch (err) {
    await t.rollback();
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = {
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
};