// File: src/controllers/moduleController.js
/**
 * @fileoverview Controller untuk mengelola CRUD (Create, Read, Update, Delete) entitas Module.
 * Controller ini diakses khusus oleh Admin.
 */
const db = require('../../models');
const Module = db.Module;
const Course = db.Course;
// Impor sequelize untuk menjalankan transaksi database (diperlukan untuk reordering)
const { sequelize } = require('../../models'); 

/**
 * @function createModule
 * @description Membuat Module baru di dalam Course dan secara otomatis menentukan sequence_order.
 * @route POST /api/v1/admin/courses/:course_id/modules
 *
 * @param {object} req - Objek request (params: course_id, body: { title, module_type, video_url, estimasi_waktu_menit, ... })
 * @param {object} res - Objek response
 * @returns {object} Module yang baru dibuat.
 */
const createModule = async (req, res) => {
  const { course_id } = req.params;
  const {
    title,
    module_type, // 'video', 'ebook', 'quiz'
    video_url,
    ebook_url,
    quiz_id,
    durasi_video_menit, //
    estimasi_waktu_menit, //
  } = req.body;

  // 1. Validasi Input Wajib
  if (!title || !module_type || !estimasi_waktu_menit) {
    return res.status(400).json({ message: 'Title, Module Type, dan Estimasi Waktu wajib diisi.' });
  }

  // 2. Validasi Konten berdasarkan Tipe
  if (module_type === 'video' && !video_url) {
     return res.status(400).json({ message: 'Video URL wajib diisi untuk modul video.' });
  }

  if (module_type === 'ebook' && !ebook_url) {
     return res.status(400).json({ message: 'Ebook URL wajib diisi untuk modul ebook.' });
  }

  try {
    // 3. Cek apakah course-nya ada
    const course = await Course.findByPk(course_id);
    if (!course) {
      return res.status(404).json({ message: 'Course tidak ditemukan.' });
    }

    // 4. Hitung sequence_order berikutnya
    const lastModule = await Module.findOne({
      where: { course_id: course_id },
      order: [['sequence_order', 'DESC']],
    });

    const nextOrder = lastModule ? lastModule.sequence_order + 1 : 1;

    // 5. Buat Module baru
    const newModule = await Module.create({
      course_id: course_id,
      title,
      module_type,
      sequence_order: nextOrder,
      // Conditional assignment berdasarkan tipe
      video_url: module_type === 'video' ? video_url : null,
      ebook_url: module_type === 'ebook' ? ebook_url : null,
      quiz_id: module_type === 'quiz' ? quiz_id : null, // FK ke tabel Quiz
      durasi_video_menit: durasi_video_menit || null,
      estimasi_waktu_menit: parseInt(estimasi_waktu_menit), // Wajib diisi (untuk kalkulasi total jam sertifikat)
    });

    return res.status(201).json(newModule);
  } catch (err) {
    console.error('Error saat membuat Module:', err.message);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function updateModule
 * @description Memperbarui Module berdasarkan ID-nya.
 * @route PUT /api/v1/admin/modules/:id
 *
 * @param {object} req - Objek request (params: id, body: { title, module_type, ... })
 * @param {object} res - Objek response
 * @returns {object} Module yang sudah diperbarui.
 */
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
    
    // Update data dan reset field yang tidak relevan jika tipe berubah
    module.title = title || module.title;
    module.module_type = module_type || module.module_type;
    
    module.video_url = module.module_type === 'video' ? video_url : null;
    module.ebook_url = module.module_type === 'ebook' ? ebook_url : null;
    module.quiz_id = module.module_type === 'quiz' ? quiz_id : null;
    
    module.durasi_video_menit = durasi_video_menit || module.durasi_video_menit;
    module.estimasi_waktu_menit = estimasi_waktu_menit || module.estimasi_waktu_menit;

    await module.save();
    return res.status(200).json(module);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function deleteModule
 * @description Menghapus Module berdasarkan ID-nya.
 * @route DELETE /api/v1/admin/modules/:id
 *
 * @param {object} req - Objek request (params: id)
 * @param {object} res - Objek response
 * @returns {object} Pesan sukses.
 */
const deleteModule = async (req, res) => {
  try {
    const module = await Module.findByPk(req.params.id);
    if (!module) {
      return res.status(404).json({ message: 'Module tidak ditemukan.' });
    }

    // Hapus Module. Ini akan memicu CASCADE DELETE pada progres user terkait.
    await module.destroy(); 
    return res.status(200).json({ message: 'Module berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function reorderModules
 * @description Memperbarui sequence_order semua modul di dalam satu Course 
 * berdasarkan urutan yang diberikan oleh frontend (fitur drag-and-drop).
 * @route POST /api/v1/admin/courses/:course_id/reorder-modules
 *
 * @param {object} req - Objek request (params: course_id, body: { module_ids: string[] })
 * @param {object} res - Objek response
 * @returns {object} Pesan sukses.
 */
const reorderModules = async (req, res) => {
  const { course_id } = req.params;
  const { module_ids } = req.body; // Menerima array ID kustom Module

  if (!Array.isArray(module_ids) || module_ids.length === 0) {
    return res.status(400).json({ message: 'module_ids harus berupa array.' });
  }

  // Mulai transaksi database untuk menjamin integritas data
  const t = await sequelize.transaction();

  try {
    // 1. Buat array Promise untuk update sequence_order setiap Module
    const updatePromises = module_ids.map((id, index) => {
      return Module.update(
        { sequence_order: index + 1 }, // Set urutan baru berdasarkan index array (+1)
        { 
          where: { 
            id: id,
            course_id: course_id // Pastikan Module tersebut memang milik Course ini
          },
          transaction: t,
        }
      );
    });

    // 2. Tunggu semua operasi update selesai
    await Promise.all(updatePromises);

    // 3. Konfirmasi (commit) transaksi
    await t.commit();

    return res.status(200).json({ message: 'Urutan modul berhasil diperbarui.' });

  } catch (err) {
    // Batalkan (rollback) transaksi jika ada error
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