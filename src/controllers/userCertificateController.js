// File: src/controllers/userCertificateController.js
/**
 * @fileoverview User Certificate Controller - Endpoint untuk user generate sertifikat sendiri
 */

const fs = require('fs');
const path = require('path');
const db = require('../../models');
const { generateCustomId } = require('../utils/idGenerator');
const { uploadToSupabase } = require('../utils/uploadToSupabase');
const { generateCertificatePDF, generateCertificatePNG } = require('../utils/certificateGenerator');

const { Certificate, CertificateTemplate, User, Course, Module, UserModuleProgress } = db;

/**
 * @function checkCourseCompletion
 * @description Check apakah user sudah menyelesaikan course dan eligible untuk certificate
 * @route GET /api/v1/user-certificates/check/:course_id
 */
exports.checkCourseCompletion = async (req, res) => {
  try {
    const userId = req.user.id;
    const { course_id } = req.params;

    // Check if course exists
    const course = await Course.findByPk(course_id, {
      include: {
        model: CertificateTemplate,
        as: 'certificateTemplate'
      }
    });

    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course tidak ditemukan' 
      });
    }

    // Count total modules
    const totalModules = await Module.count({ where: { course_id } });

    // Count completed modules
    const completedModules = await UserModuleProgress.count({
      where: { user_id: userId, is_completed: true },
      include: {
        model: Module,
        as: 'module',
        where: { course_id },
        required: true
      }
    });

    const isCompleted = totalModules > 0 && completedModules >= totalModules;

    // Check if already has certificate
    const existingCert = await Certificate.findOne({
      where: { user_id: userId, course_id }
    });

    return res.status(200).json({
      success: true,
      data: {
        course_id,
        course_title: course.title,
        total_modules: totalModules,
        completed_modules: completedModules,
        is_completed: isCompleted,
        has_certificate: !!existingCert,
        eligible_for_certificate: isCompleted && !existingCert,
        recommended_template_id: course.certificate_template_id,
        existing_certificate: existingCert
      }
    });

  } catch (err) {
    console.error('Error checkCourseCompletion:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

/**
 * @function previewUserCertificate
 * @description Preview sertifikat sebelum di-generate oleh user
 * @route POST /api/v1/user-certificates/preview
 */
exports.previewUserCertificate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { course_id, template_id } = req.body;

    const user = await User.findByPk(userId);
    const course = await Course.findByPk(course_id);

    if (!user || !course) {
      return res.status(404).json({
        success: false,
        message: 'User atau Course tidak ditemukan'
      });
    }

    // Get template
    let template = null;
    if (template_id) {
      template = await CertificateTemplate.findByPk(template_id);
    }

    const previewData = {
      recipient_name: user.username,
      course_title: course.title,
      instructor_name: course.mentor_name || 'Lentera Karir Instructor',
      completion_date: new Date(),
      template_url: template ? template.file_url : null,
      template_name: template ? template.name : 'Default Template'
    };

    return res.status(200).json({
      success: true,
      data: previewData
    });

  } catch (err) {
    console.error('Error previewUserCertificate:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

/**
 * @function generateUserCertificate
 * @description Generate sertifikat oleh user setelah memilih template
 * @route POST /api/v1/user-certificates/generate
 */
exports.generateUserCertificate = async (req, res) => {
  const userId = req.user.id;
  const { course_id, template_id, format = 'pdf' } = req.body;

  let tempFilePath = null;

  try {
    // 1. Verify course completion
    const totalModules = await Module.count({ where: { course_id } });
    const completedModules = await UserModuleProgress.count({
      where: { user_id: userId, is_completed: true },
      include: {
        model: Module,
        as: 'module',
        where: { course_id },
        required: true
      }
    });

    if (totalModules === 0 || completedModules < totalModules) {
      return res.status(400).json({
        success: false,
        message: 'Course belum selesai. Selesaikan semua modul terlebih dahulu.',
        progress: `${completedModules}/${totalModules}`
      });
    }

    // 2. Check if already has certificate
    const existingCert = await Certificate.findOne({
      where: { user_id: userId, course_id }
    });

    if (existingCert) {
      return res.status(400).json({
        success: false,
        message: 'Sertifikat sudah pernah dibuat untuk course ini',
        data: existingCert
      });
    }

    // 3. Get user and course data
    const user = await User.findByPk(userId);
    const course = await Course.findByPk(course_id);

    if (!user || !course) {
      return res.status(404).json({
        success: false,
        message: 'User atau Course tidak ditemukan'
      });
    }

    // 4. Get template
    let template = null;
    if (template_id) {
      template = await CertificateTemplate.findByPk(template_id);
    } else if (course.certificate_template_id) {
      template = await CertificateTemplate.findByPk(course.certificate_template_id);
    }

    const backgroundUrl = template ? template.file_url : null;

    // 5. Prepare certificate data
    const certificateData = {
      recipient_name: user.username,
      course_title: course.title,
      instructor_name: course.mentor_name || 'Lentera Karir Instructor',
      completion_date: new Date(),
      background_url: backgroundUrl
    };

    // 6. Generate file
    const tempDir = path.join(__dirname, '../../public/temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const fileName = `cert-${userId}-${course_id}-${Date.now()}.${format}`;
    tempFilePath = path.join(tempDir, fileName);

    if (format === 'png') {
      await generateCertificatePNG(certificateData, tempFilePath);
    } else {
      await generateCertificatePDF(certificateData, tempFilePath);
    }

    // 7. Upload to Supabase
    const fileBuffer = fs.readFileSync(tempFilePath);
    const mockFile = {
      buffer: fileBuffer,
      originalname: fileName,
      mimetype: format === 'png' ? 'image/png' : 'application/pdf'
    };

    const publicUrl = await uploadToSupabase(mockFile, 'certificates', 'generated');

    // 8. Create certificate record
    const certId = generateCustomId('CERT');
    const certificate = await Certificate.create({
      id: certId,
      user_id: userId,
      course_id: course_id,
      certificate_url: publicUrl,
      recipient_name: certificateData.recipient_name,
      course_title: certificateData.course_title,
      instructor_name: certificateData.instructor_name,
      issued_at: new Date(),
      total_hours: 0,
      status: 'generated'
    });

    // 9. Cleanup temp file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    return res.status(201).json({
      success: true,
      message: 'Sertifikat berhasil dibuat!',
      data: certificate
    });

  } catch (err) {
    console.error('Error generateUserCertificate:', err);
    
    // Cleanup temp file on error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Gagal membuat sertifikat',
      error: err.message
    });
  }
};

/**
 * @function getAvailableTemplates
 * @description Get semua template yang available untuk user
 * @route GET /api/v1/user-certificates/templates
 */
exports.getAvailableTemplates = async (req, res) => {
  try {
    const templates = await CertificateTemplate.findAll({
      where: { is_active: true },
      attributes: ['id', 'name', 'preview_url', 'file_url']
    });

    return res.status(200).json({
      success: true,
      data: templates
    });

  } catch (err) {
    console.error('Error getAvailableTemplates:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};
