// File: src/controllers/moduleController.js
/**
 * @fileoverview Controller untuk mengelola CRUD (Create, Read, Update, Delete) entitas Module.
 * Controller ini diakses khusus oleh Admin.
 */
const db = require('../../models');
const { uploadToSupabase, deleteFromSupabase } = require('../utils/uploadToSupabase');
const Module = db.Module;
const Course = db.Course;
// Impor sequelize untuk menjalankan transaksi database (diperlukan untuk reordering)
const { sequelize } = require('../../models');
const { getVideoDurationInSeconds } = require('get-video-duration');
const ffprobe = require('ffprobe-static');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Helper untuk mendapatkan durasi video dari buffer
 */
const getVideoDuration = async (buffer) => {
  const tempFilePath = path.join(os.tmpdir(), `temp-${Date.now()}.mp4`);
  fs.writeFileSync(tempFilePath, buffer);
  try {
    const duration = await getVideoDurationInSeconds(tempFilePath, ffprobe.path);
    fs.unlinkSync(tempFilePath); // Hapus file temp
    return Math.ceil(duration / 60); // Konversi ke menit (pembulatan ke atas)
  } catch (error) {
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    console.error('Error getting video duration:', error);
    return 0;
  }
};

/**
 * @function createModule
 * @description Membuat Module baru di dalam Course.
 * @route POST /api/v1/admin/courses/:course_id/modules
 *
 * @param {object} req - Objek request (params: course_id, body: { title, ... }, file: req.file untuk video/ebook)
 * @param {object} res - Objek response
 * @returns {object} Module yang baru dibuat.
 */
const createModule = async (req, res) => {
  const { course_id } = req.params;
  const { title } = req.body;

  // Tentukan module_type otomatis dari tipe file yang diupload
  let module_type;

  const files = req.files || [];
  if (files.length > 0) {
    // Deteksi tipe berdasarkan MIME type file pertama
    const firstFile = files[0];
    if (firstFile.mimetype.startsWith('video/')) {
      module_type = 'video';
      // Validasi semua file harus video
      if (files.some(f => !f.mimetype.startsWith('video/'))) {
        return res.status(400).json({ message: 'Semua file harus bertipe video.' });
      }
    } else if (firstFile.mimetype.includes('pdf')) {
      module_type = 'ebook';
      // Validasi semua file harus PDF
      if (files.some(f => !f.mimetype.includes('pdf'))) {
        return res.status(400).json({ message: 'Semua file harus bertipe ebook/pdf.' });
      }
    } else {
      return res.status(400).json({ message: 'Tipe file tidak valid. Hanya video atau PDF yang diperbolehkan.' });
    }
  } else {
    // Jika tidak ada file, asumsikan quiz
    module_type = 'quiz';
  }

  if (!['video', 'ebook', 'quiz'].includes(module_type)) {
    return res.status(400).json({ message: 'Module type tidak valid.' });
  }

  try {
    // 1. Cek apakah course-nya ada
    const course = await Course.findByPk(course_id);
    if (!course) {
      return res.status(404).json({ message: 'Course tidak ditemukan.' });
    }

    // 2. Hitung sequence_order awal
    const lastModule = await Module.findOne({
      where: { course_id: course_id },
      order: [['sequence_order', 'DESC']],
    });

    let currentOrder = lastModule ? lastModule.sequence_order + 1 : 1;
    const createdModules = [];

    // 3. Loop setiap file yang diupload (khusus video/ebook)
    if (module_type === 'video' || module_type === 'ebook') {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
      let videoUrl = null;
      let ebookUrl = null;
      let detectedDuration = 0;

      let moduleTitle = title;
      if (req.files.length > 1) {
        moduleTitle = title ? `${title} (Part ${i + 1})` : file.originalname;
      } else {
        moduleTitle = title || file.originalname;
      }

      if (module_type === 'video') {
        try {
          detectedDuration = await getVideoDuration(file.buffer);
          videoUrl = await uploadToSupabase(file, 'videos', 'modules');
        } catch (uploadErr) {
          console.error(`Failed to upload video ${file.originalname}:`, uploadErr);
          continue;
        }
      } else if (module_type === 'ebook') {
        try {
          ebookUrl = await uploadToSupabase(file, 'ebooks', 'modules');
        } catch (uploadErr) {
          console.error(`Failed to upload ebook ${file.originalname}:`, uploadErr);
          continue;
        }
      }

        const newModule = await Module.create({
          course_id: course_id,
          title: moduleTitle,
          sequence_order: currentOrder++,
          video_url: videoUrl,
          ebook_url: ebookUrl
        });

        createdModules.push(newModule);
      }
    } else if (module_type === 'quiz') {
      // Untuk quiz, frontend/admin harus menyediakan `quiz_id` di body
      const { quiz_id } = req.body;
      if (!quiz_id) {
        return res.status(400).json({ message: 'quiz_id wajib diberikan untuk module tipe quiz.' });
      }
      const newModule = await Module.create({
        course_id: course_id,
        title: title || 'Quiz Module',
        sequence_order: currentOrder++,
        quiz_id: quiz_id,
        video_url: null,
        ebook_url: null
      });
      createdModules.push(newModule);
    }

    if (createdModules.length === 0) {
      return res.status(500).json({ message: 'Gagal membuat modul. Terjadi kesalahan saat upload.' });
    }

    if (createdModules.length === 1) {
      return res.status(201).json({ data: createdModules[0], message: 'Module created successfully (draft)' });
    }

    return res.status(201).json({ data: createdModules, message: `${createdModules.length} modules created successfully (draft)` });

  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function updateModule
 * @description Memperbarui Module berdasarkan ID-nya.
 * @route PUT /api/v1/admin/modules/:id
 *
 * @param {object} req - Objek request (params: id, body: { title, ... }, file: req.file untuk video/ebook)
 * @param {object} res - Objek response
 * @returns {object} Module yang sudah diperbarui.
 */
const updateModule = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    quiz_id
  } = req.body;

  try {
    const module = await Module.findByPk(id);
    if (!module) {
      return res.status(404).json({ message: 'Module tidak ditemukan.' });
    }

    // Update data dasar
    module.title = title || module.title;

    // Determine current module type from stored fields
    const currentType = module.video_url ? 'video' : (module.ebook_url ? 'ebook' : (module.quiz_id ? 'quiz' : 'quiz'));

    // Handle file upload untuk video
    if (currentType === 'video') {
      if (req.file) {
        try {
          // Hapus file lama
          if (module.video_url) {
            await deleteFromSupabase(module.video_url, 'videos');
          }
          // Upload yang baru
          module.video_url = await uploadToSupabase(req.file, 'videos', 'modules');
        } catch (uploadErr) {
          return res.status(400).json({ message: 'Gagal upload video.', error: uploadErr.message });
        }
      }
      module.ebook_url = null; // Reset ebook jika tipe video
    }
    // Handle file upload untuk ebook
    if (currentType === 'ebook') {
      if (req.file) {
        try {
          // Hapus file lama
          if (module.ebook_url) {
            await deleteFromSupabase(module.ebook_url, 'ebooks');
          }
          // Upload yang baru
          module.ebook_url = await uploadToSupabase(req.file, 'ebooks', 'modules');
        } catch (uploadErr) {
          return res.status(400).json({ message: 'Gagal upload ebook.', error: uploadErr.message });
        }
      }
      module.video_url = null; // Reset video jika tipe ebook
    }
    // Handle quiz
    if (currentType === 'quiz') {
      module.quiz_id = quiz_id || module.quiz_id;
      module.video_url = null;
      module.ebook_url = null;
    }

    // Kolom durasi dan estimasi waktu sudah dihapus

    await module.save();
    return res.status(200).json(module);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function deleteModule
 * @description Menghapus Module berdasarkan ID-nya beserta file yang terkait di Supabase.
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

    // Hapus file dari Supabase
    if (module.video_url) {
      await deleteFromSupabase(module.video_url, 'videos');
    }
    if (module.ebook_url) {
      await deleteFromSupabase(module.ebook_url, 'ebooks');
    }

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
  const { module_ids } = req.body;

  if (!Array.isArray(module_ids) || module_ids.length === 0) {
    return res.status(400).json({ message: 'module_ids harus berupa array.' });
  }

  const t = await sequelize.transaction();

  try {
    const updatePromises = module_ids.map((id, index) => {
      return Module.update(
        { sequence_order: index + 1 },
        {
          where: {
            id: id,
            course_id: course_id // Pastikan modul milik course yang benar
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

/**
 * @function getModulesByCourse
 * @description Mengambil semua modules dalam satu course
 * @route GET /api/v1/admin/courses/:course_id/modules
 */
const getModulesByCourse = async (req, res) => {
  const { course_id } = req.params;
  try {
    const modules = await Module.findAll({
      where: { course_id },
      order: [['sequence_order', 'ASC']],
      include: [
        {
          model: db.Quiz,
          as: 'quiz',
          attributes: ['id', 'title', 'description']
        }
      ]
    });

    return res.status(200).json(modules);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function getModuleById
 * @description Mengambil satu Module berdasarkan ID (Admin)
 * @route GET /api/v1/admin/modules/:id
 */
const getModuleById = async (req, res) => {
  const { id } = req.params;
  try {
    const module = await Module.findByPk(id, {
      include: { model: Course, as: 'course', attributes: ['id', 'title'] }
    });
    if (!module) return res.status(404).json({ message: 'Module tidak ditemukan.' });

    const m = module.toJSON();
    m.module_id = m.id;
    // derive type
    if (m.video_url) m.type = 'video';
    else if (m.ebook_url) m.type = 'ebook';
    else if (m.quiz_id) m.type = 'quiz';
    else m.type = 'quiz';
    m.duration = 0;

    return res.status(200).json({ data: m });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = {
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
  getModuleById,
  getModulesByCourse
};
