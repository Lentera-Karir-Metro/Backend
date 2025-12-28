// File: src/controllers/certificateController.js
/**
 * @fileoverview Certificate Controller - Menangani sertifikat user dan admin generator
 */
const db = require('../../models');
const { uploadToSupabase, deleteFromSupabase } = require('../utils/uploadToSupabase');
const { Certificate, User, CertificateTemplate } = db;
const { generateCustomId } = require('../utils/idGenerator');
const { generateCertificatePDF, generateCertificatePNG } = require('../utils/certificateGenerator');
const fs = require('fs');
const path = require('path');

/**
 * @function getMyCertificates
 * @description Mengambil semua sertifikat milik user
 * @route GET /api/v1/certificates
 */
exports.getMyCertificates = async (req, res) => {
  const userId = req.user.id;

  try {
    const certificates = await Certificate.findAll({
      where: { user_id: userId },
      include: [
        {
          model: db.Course,
          as: 'Course',
          attributes: ['id', 'title', 'mentor_name', 'thumbnail_url']
        }
      ],
      order: [['issued_at', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: certificates
    });
  } catch (err) {
    console.error('Error getMyCertificates:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data sertifikat',
      error: err.message
    });
  }
};

/**
 * @function getAllCertificates
 * @description Admin - Mengambil semua sertifikat
 * @route GET /api/v1/certificates/admin/all
 */
exports.getAllCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'email']
        },
        {
          model: Course,
          as: 'Course',
          attributes: ['id', 'title']
        }
      ],
      order: [['issued_at', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: certificates
    });
  } catch (err) {
    console.error('Error getAllCertificates:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data sertifikat',
      error: err.message
    });
  }
};

/**
 * @function getCertificateById
 * @description Mengambil detail sertifikat berdasarkan ID
 * @route GET /api/v1/certificates/:id
 */
exports.getCertificateById = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const certificate = await Certificate.findOne({
      where: { id },
      include: [
        {
          model: Course,
          as: 'Course',
          attributes: ['id', 'title']
        },
        {
          model: User,
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Sertifikat tidak ditemukan'
      });
    }

    // Allow access if owner OR admin
    if (certificate.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }

    return res.status(200).json({
      success: true,
      data: certificate
    });
  } catch (err) {
    console.error('Error getCertificateById:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail sertifikat',
      error: err.message
    });
  }
};

// --- ADMIN FEATURES ---

/**
 * @function getTemplates
 * @description Mengambil semua template sertifikat
 * @route GET /api/v1/admin/certificates/templates
 */
exports.getTemplates = async (req, res) => {
  try {
    const templates = await CertificateTemplate.findAll({
      where: { is_active: true }
    });
    return res.status(200).json({ success: true, data: templates });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * @function getPendingCertificates
 * @description Admin: list users who completed course but certificate not generated
 * @route GET /api/v1/admin/certificates/pending
 */
exports.getPendingCertificates = async (req, res) => {
  try {
    // Find enrollments with status success that do not have a certificate
    const enrollments = await db.UserEnrollment.findAll({
      where: { status: 'success' },
      include: [
        { model: db.User, as: 'User', attributes: ['id', 'username', 'email'] },
        { model: db.Course, as: 'Course', attributes: ['id', 'title', 'mentor_name'] }
      ],
      order: [['enrolled_at', 'DESC']]
    });

    // Filter out those with existing certificate
    const pending = [];
    for (const en of enrollments) {
      const existing = await Certificate.findOne({ where: { user_id: en.user_id, course_id: en.course_id } });
      if (!existing) {
        pending.push({
          user_id: en.user_id,
          username: en.User?.username || null,
          email: en.User?.email || null,
          course_id: en.course_id,
          course_title: en.Course?.title || null,
          completion_date: en.enrolled_at,
          instructor_name: en.Course?.mentor_name || null
        });
      }
    }

    return res.status(200).json({ success: true, data: pending });
  } catch (err) {
    console.error('Error getPendingCertificates:', err.message);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

/**
 * @function previewCertificateData
 * @description Admin: preview certificate data for a given user+course and template
 * @route GET /api/v1/admin/certificates/:userId/:courseId/preview
 */
exports.previewCertificateData = async (req, res) => {
  const { userId, courseId } = req.params;
  try {
    const user = await db.User.findByPk(userId, { attributes: ['id', 'username', 'email'] });
    const course = await db.Course.findByPk(courseId, { attributes: ['id', 'title', 'mentor_name'] });
    if (!user || !course) return res.status(404).json({ success: false, message: 'User or Course not found' });

    // Find enrollment completion date
    const enrollment = await db.UserEnrollment.findOne({ where: { user_id: userId, course_id: courseId, status: 'success' } });
    const completion_date = enrollment ? enrollment.enrolled_at : null;

    // Prepare preview payload (no file generation here)
    const preview = {
      user: { id: user.id, name: user.username, email: user.email },
      course: { id: course.id, title: course.title, instructor_name: course.mentor_name },
      completion_date
    };
    return res.status(200).json({ success: true, data: preview });
  } catch (err) {
    console.error('Error previewCertificateData:', err.message);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

/**
 * @function createTemplate
 * @description Upload template sertifikat baru
 * @route POST /api/v1/admin/certificates/templates
 */
exports.createTemplate = async (req, res) => {
  const { name } = req.body;
  if (!req.file) {
    return res.status(400).json({ message: 'File template wajib diupload.' });
  }

  try {
    // Use 'certificates' bucket, 'templates' folder
    const fileUrl = await uploadToSupabase(req.file, 'certificates', 'templates');
    // Note: Preview URL logic would go here (e.g. convert first page of PDF to image)
    // For now we just use a placeholder or the same URL if it's an image
    const previewUrl = fileUrl;

    const template = await CertificateTemplate.create({
      name,
      file_url: fileUrl,
      preview_url: previewUrl
    });

    return res.status(201).json({ success: true, data: template });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * @function deleteTemplate
 * @description Admin - Hapus template sertifikat (hapus file di Supabase dan record DB)
 * @route DELETE /api/v1/certificates/admin/templates/:id
 */
exports.deleteTemplate = async (req, res) => {
  const { id } = req.params;

  try {
    const template = await CertificateTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template tidak ditemukan.' });
    }

    // Attempt to delete file from Supabase (best-effort)
    try {
      await deleteFromSupabase(template.file_url, 'certificates');
    } catch (supErr) {
      console.warn('Failed to delete file from Supabase for template', id, supErr.message);
      // continue to remove DB record even if file deletion failed
    }

    await template.destroy();

    return res.status(200).json({ success: true, message: 'Template berhasil dihapus.' });
  } catch (err) {
    console.error('Error deleteTemplate:', err.message);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

/**
 * @function generateCertificate
 * @description Admin - Generate sertifikat untuk user tertentu (by ID).
 * Data user dan course diambil otomatis dari database.
 * @route POST /api/v1/certificates/admin/generate
 */
exports.generateCertificate = async (req, res) => {
  const { user_id, course_id, template_id, format = 'pdf' } = req.body;

  let tempFilePath = null;

  try {
    // 1. Ambil data User dan Course OTOMATIS
    const user = await User.findByPk(user_id);
    const course = await db.Course.findByPk(course_id);

    if (!user || !course) {
      return res.status(404).json({
        success: false,
        message: 'User or Course not found'
      });
    }

    // 2. Ambil template jika ada
    let backgroundUrl = null;
    if (template_id) {
      const template = await CertificateTemplate.findByPk(template_id);
      if (template) {
        backgroundUrl = template.file_url;
      }
    }

    // 3. Siapkan data sertifikat (OTOMATIS dari database)
    const certificateData = {
      recipient_name: user.username,
      course_title: course.title,
      instructor_name: course.mentor_name || 'Lentera Karir Instructor',
      completion_date: new Date(),
      background_url: backgroundUrl
    };

    // 4. Generate File (PDF/PNG)
    const tempDir = path.join(__dirname, '../../public/temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const fileName = `cert-${user_id}-${course_id}-${Date.now()}.${format}`;
    tempFilePath = path.join(tempDir, fileName);

    if (format === 'png') {
      await generateCertificatePNG(certificateData, tempFilePath);
    } else {
      await generateCertificatePDF(certificateData, tempFilePath);
    }

    // 5. Upload ke Supabase
    const fileBuffer = fs.readFileSync(tempFilePath);
    const mockFile = {
      buffer: fileBuffer,
      originalname: fileName,
      mimetype: format === 'png' ? 'image/png' : 'application/pdf'
    };

    const bucketName = 'certificates';
    const publicUrl = await uploadToSupabase(mockFile, bucketName, 'generated');

    // 6. Simpan/Update Record Certificate di Database
    let certificate = await Certificate.findOne({
      where: { user_id, course_id }
    });

    const certId = generateCustomId('CERT');

    if (certificate) {
      // Update
      certificate.certificate_url = publicUrl;
      certificate.issued_at = new Date();
      certificate.status = 'generated';
      await certificate.save();
    } else {
      // Create new
      certificate = await Certificate.create({
        id: certId,
        user_id: user_id,
        course_id: course_id,
        certificate_url: publicUrl,
        recipient_name: certificateData.recipient_name,
        course_title: certificateData.course_title,
        instructor_name: certificateData.instructor_name,
        issued_at: certificateData.completion_date,
        total_hours: 0,
        status: 'generated'
      });
    }

    // Cleanup temp file
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

    return res.status(201).json({
      success: true,
      message: 'Sertifikat berhasil dibuat.',
      data: certificate,
      url: publicUrl
    });

  } catch (err) {
    console.error('Error generateCertificate:', err);
    if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    return res.status(500).json({
      success: false,
      message: 'Gagal membuat sertifikat',
      error: err.message
    });
  }
};

/**
 * @function generateBulkCertificates
 * @description Generate certificates from CSV
 * @route POST /api/v1/admin/certificates/bulk-generate
 */
exports.generateBulkCertificates = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'File CSV wajib diupload.' });
  }

  try {
    // Read file content
    const filePath = req.file.path; // Multer saves to temp
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Simple CSV Parse (Assuming Header: Name,Email,Class,Date)
    const rows = fileContent.split('\n').filter(row => row.trim() !== '');
    const headers = rows[0].split(','); // Skip headers in real logic

    const results = [];

    // Start from index 1 to skip header
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].split(',');
      if (cols.length < 3) continue;

      const name = cols[0]?.trim();
      const email = cols[1]?.trim();
      const className = cols[2]?.trim();
      const date = cols[3]?.trim();

      if (name && className) {
        const certId = generateCustomId('CERT');
        const newCert = await Certificate.create({
          id: certId,
          recipient_name: name,
          course_title: className,
          issued_at: date ? new Date(date) : new Date(),
          total_hours: 0, // Default to 0 for bulk generation
          certificate_url: 'https://placehold.co/600x400?text=Certificate+Generated',
        });
        results.push(newCert);
      }
    }

    // Cleanup temp file
    fs.unlinkSync(filePath);

    return res.status(200).json({
      success: true,
      message: `${results.length} Sertifikat berhasil dibuat!`,
      count: results.length,
      download_url: 'https://example.com/dummy-zip-download.zip' // Mock ZIP URL
    });

  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * @function updateCertificate
 * @description Update sertifikat (misal: ganti file atau nama)
 * @route PUT /api/v1/certificates/admin/:id
 */
exports.updateCertificate = async (req, res) => {
  const { id } = req.params;
  const { recipient_name, course_title } = req.body;

  try {
    const certificate = await Certificate.findByPk(id);
    if (!certificate) {
      return res.status(404).json({ message: 'Sertifikat tidak ditemukan.' });
    }

    // Update fields if provided
    if (recipient_name) certificate.recipient_name = recipient_name;
    if (course_title) certificate.course_title = course_title;

    // If file uploaded, update URL
    if (req.file) {
      // Delete old file if exists (optional logic)
      // await deleteFromSupabase(certificate.certificate_url);

      const fileUrl = await uploadToSupabase(req.file, 'certificates', 'generated');
      certificate.certificate_url = fileUrl;
    }

    await certificate.save();

    return res.status(200).json({
      success: true,
      message: 'Sertifikat berhasil diperbarui.',
      data: certificate
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * @function deleteCertificate
 * @description Hapus sertifikat
 * @route DELETE /api/v1/certificates/admin/:id
 */
exports.deleteCertificate = async (req, res) => {
  const { id } = req.params;

  try {
    const certificate = await Certificate.findByPk(id);
    if (!certificate) {
      return res.status(404).json({ message: 'Sertifikat tidak ditemukan.' });
    }

    // Delete file from storage (optional logic)
    // if (certificate.certificate_url) {
    //   await deleteFromSupabase(certificate.certificate_url);
    // }

    await certificate.destroy();

    return res.status(200).json({
      success: true,
      message: 'Sertifikat berhasil dihapus.'
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * @function getUserCertificateStatus
 * @description User - Cek status sertifikat untuk course tertentu
 * @route GET /api/v1/certificates/status/:course_id
 */
exports.getUserCertificateStatus = async (req, res) => {
  const userId = req.user.id;
  const { course_id } = req.params;

  try {
    const enrollment = await db.UserEnrollment.findOne({
      where: { user_id: userId, course_id: course_id, status: 'success' }
    });

    if (!enrollment) {
      return res.status(400).json({ status: 'NOT_ENROLLED', message: 'Anda belum terdaftar di kursus ini.' });
    }

    const cert = await Certificate.findOne({
      where: { user_id: userId, course_id: course_id }
    });

    if (cert) {
      return res.status(200).json({
        status: 'AVAILABLE',
        message: 'Sertifikat tersedia.',
        certificate_url: cert.certificate_url
      });
    }

    const totalModules = await db.Module.count({ where: { course_id } });
    const completedModules = await db.UserModuleProgress.count({
      where: { user_id: userId, is_completed: true },
      include: [{ model: db.Module, as: 'module', where: { course_id } }]
    });

    if (completedModules < totalModules) {
      return res.status(200).json({
        status: 'INCOMPLETE',
        message: 'Sertifikat belum dapat diclaim karena belum menyelesaikan kursus.',
        progress: `${completedModules}/${totalModules}`
      });
    }

    return res.status(200).json({
      status: 'WAITING',
      message: 'Mohon tunggu, sertifikat sedang diproses oleh admin.'
    });

  } catch (err) {
    console.error('Error getUserCertificateStatus:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * @function previewCertificate
 * @description Admin - Preview sertifikat sebelum generate
 * @route POST /api/v1/certificates/admin/preview
 */
exports.previewCertificate = async (req, res) => {
  const { user_id, course_id, template_id } = req.body;

  try {
    const user = await User.findByPk(user_id);
    const course = await db.Course.findByPk(course_id);

    if (!user || !course) {
      return res.status(404).json({ message: 'User or Course not found' });
    }

    let backgroundUrl = null;
    if (template_id) {
      const template = await CertificateTemplate.findByPk(template_id);
      if (template) {
        backgroundUrl = template.file_url;
      }
    }

    const certificateData = {
      recipient_name: user.username,
      course_title: course.title,
      instructor_name: course.mentor_name || 'Lentera Karir Instructor',
      completion_date: new Date(),
      background_url: backgroundUrl
    };

    const tempDir = path.join(__dirname, '../../public/temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const fileName = `preview-${user_id}-${course_id}-${Date.now()}.png`;
    const outputPath = path.join(tempDir, fileName);

    await generateCertificatePNG(certificateData, outputPath);

    res.sendFile(outputPath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
      }
      setTimeout(() => {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      }, 10000);
    });

  } catch (err) {
    console.error('Error previewCertificate:', err);
    return res.status(500).json({ message: 'Gagal membuat preview sertifikat', error: err.message });
  }
};

/**
 * @function getCertificateCandidates
 * @description Admin - Mengambil daftar user yang sudah menyelesaikan kursus tapi belum punya sertifikat.
 * @route GET /api/v1/certificates/admin/candidates
 */
exports.getCertificateCandidates = async (req, res) => {
  try {
    const enrollments = await db.UserEnrollment.findAll({
      where: { status: 'success' },
      include: [
        { model: User, as: 'User', attributes: ['id', 'username', 'email'] },
        { model: db.Course, as: 'Course', attributes: ['id', 'title', 'mentor_name'] }
      ]
    });

    const candidates = [];

    for (const enrollment of enrollments) {
      if (!enrollment.User || !enrollment.Course) continue;

      const userId = enrollment.user_id;
      const courseId = enrollment.course_id;

      const existingCert = await Certificate.findOne({
        where: { user_id: userId, course_id: courseId }
      });

      if (existingCert) continue;

      const totalModules = await db.Module.count({ where: { course_id: courseId } });
      if (totalModules === 0) continue;

      const completedModulesCount = await db.UserModuleProgress.count({
        where: { user_id: userId, is_completed: true },
        include: [{ model: db.Module, as: 'module', where: { course_id: courseId } }]
      });

      if (completedModulesCount === totalModules) {
        const lastProgress = await db.UserModuleProgress.findOne({
          where: { user_id: userId, is_completed: true },
          include: [{ model: db.Module, as: 'module', where: { course_id: courseId } }],
          order: [['updatedAt', 'DESC']]
        });

        candidates.push({
          user_id: userId,
          user_name: enrollment.User.username,
          user_email: enrollment.User.email,
          course_id: courseId,
          course_title: enrollment.Course.title,
          mentor_name: enrollment.Course.mentor_name,
          completed_at: lastProgress ? lastProgress.updatedAt : new Date(),
          status: 'Waiting for Certificate'
        });
      }
    }

    return res.status(200).json({ success: true, data: candidates });

  } catch (err) {
    console.error('Error getCertificateCandidates:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data kandidat sertifikat.',
      error: err.message
    });
  }
};
