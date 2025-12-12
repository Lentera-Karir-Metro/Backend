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
 * @param {object} req - Objek request (params: course_id, body: { title, module_type, estimasi_waktu_menit, ... }, file: req.file untuk video/ebook)
 * @param {object} res - Objek response
 * @returns {object} Module yang baru dibuat.
 */
const createModule = async (req, res) => {
  const { course_id } = req.params;
  const {
    title,
    module_type, // 'video', 'ebook' (Quiz dipisah)
    estimasi_waktu_menit,
  } = req.body;

  // Validasi input wajib
  if (!title || !module_type) {
    return res.status(400).json({ message: 'Title dan Module Type wajib diisi.' });
  }

  // Validasi: untuk video dan ebook wajib ada file
  if (module_type === 'video' && !req.file) {
     return res.status(400).json({ message: 'File video wajib diupload untuk modul video.' });
  }

  if (module_type === 'ebook' && !req.file) {
     return res.status(400).json({ message: 'File ebook wajib diupload untuk modul ebook.' });
  }

  try {
    // 1. Cek apakah course-nya ada
    const course = await Course.findByPk(course_id);
    if (!course) {
      return res.status(404).json({ message: 'Course tidak ditemukan.' });
    }

    // 2. Hitung sequence_order berikutnya
    const lastModule = await Module.findOne({
      where: { course_id: course_id },
      order: [['sequence_order', 'DESC']],
    });

    const nextOrder = lastModule ? lastModule.sequence_order + 1 : 1;

    // 3. Upload file ke Supabase jika ada & Hitung Durasi
    let videoUrl = null;
    let ebookUrl = null;
    let detectedDuration = 0;

    if (module_type === 'video' && req.file) {
      try {
        // Hitung durasi otomatis sebelum upload
        detectedDuration = await getVideoDuration(req.file.buffer);
        console.log(`[Module] Detected video duration: ${detectedDuration} minutes`);
        
        videoUrl = await uploadToSupabase(req.file, 'videos', 'modules');
      } catch (uploadErr) {
        return res.status(400).json({ message: 'Gagal upload video.', error: uploadErr.message });
      }
    }

    if (module_type === 'ebook' && req.file) {
      try {
        ebookUrl = await uploadToSupabase(req.file, 'ebooks', 'modules');
      } catch (uploadErr) {
        return res.status(400).json({ message: 'Gagal upload ebook.', error: uploadErr.message });
      }
    }

    // 4. Buat Module baru
    const newModule = await Module.create({
      course_id: course_id,
      title,
      module_type,
      sequence_order: nextOrder,
      video_url: videoUrl,
      ebook_url: ebookUrl,
      // quiz_id dihapus
      durasi_video_menit: detectedDuration > 0 ? detectedDuration : (parseInt(req.body.durasi_video_menit) || 0),
      estimasi_waktu_menit: parseInt(estimasi_waktu_menit) || detectedDuration || 0,
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
 * @param {object} req - Objek request (params: id, body: { title, module_type, ... }, file: req.file untuk video/ebook)
 * @param {object} res - Objek response
 * @returns {object} Module yang sudah diperbarui.
 */
const updateModule = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    module_type,
    quiz_id,
    durasi_video_menit,
    estimasi_waktu_menit,
  } = req.body;

  try {
    const module = await Module.findByPk(id);
    if (!module) {
      return res.status(404).json({ message: 'Module tidak ditemukan.' });
    }
    
    // Update data dasar
    module.title = title || module.title;
    module.module_type = module_type || module.module_type;
    
    // Handle file upload untuk video
    if (module.module_type === 'video') {
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
    if (module.module_type === 'ebook') {
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
    if (module.module_type === 'quiz') {
      module.quiz_id = quiz_id || module.quiz_id;
      module.video_url = null;
      module.ebook_url = null;
    }
    
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

module.exports = {
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
};
