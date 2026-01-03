// File: src/utils/autoGenerateCertificate.js
/**
 * Utility function untuk auto-generate certificate ketika user menyelesaikan course
 */

const fs = require('fs');
const path = require('path');
const db = require('../../models');
const { generateCustomId } = require('./idGenerator');
const { uploadToSupabase } = require('./uploadToSupabase');
const { generateCertificatePDF, generateCertificatePNG } = require('./certificateGenerator');

/**
 * Auto-generate certificate untuk user yang sudah menyelesaikan course
 * @param {string} userId - ID user yang menyelesaikan course
 * @param {string} courseId - ID course yang diselesaikan
 */
const autoGenerateCertificate = async (userId, courseId) => {
  const { Certificate, CertificateTemplate, User, Course, Module, UserModuleProgress } = db;
  let tempFilePath = null;

  try {
    console.log('[autoGenerateCertificate] Start for userId:', userId, 'courseId:', courseId);

    // 1. Check if certificate already exists
    const existingCert = await Certificate.findOne({
      where: { user_id: userId, course_id: courseId }
    });

    if (existingCert && existingCert.status === 'generated') {
      console.log('[autoGenerateCertificate] Certificate already exists and generated');
      return existingCert;
    }

    // 2. Verify course completion
    const totalModules = await Module.count({ where: { course_id: courseId } });
    const completedModules = await UserModuleProgress.count({
      where: { user_id: userId, is_completed: true },
      include: {
        model: Module,
        as: 'module',
        where: { course_id: courseId },
        required: true
      }
    });

    if (totalModules === 0 || completedModules < totalModules) {
      console.log('[autoGenerateCertificate] Course not completed:', {
        totalModules,
        completedModules
      });
      return null;
    }

    // 3. Get user and course data
    const user = await User.findByPk(userId);
    const course = await Course.findByPk(courseId, {
      include: {
        model: CertificateTemplate,
        as: 'certificateTemplate'
      }
    });

    if (!user || !course) {
      console.log('[autoGenerateCertificate] User or Course not found');
      return null;
    }

    // 4. Get template (from course or use default)
    let template = course.certificateTemplate;
    
    // If course doesn't have template, get any active template as fallback
    if (!template) {
      template = await CertificateTemplate.findOne({
        where: { is_active: true },
        order: [['id', 'ASC']] // Get first active template
      });
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

    // 6. Generate PDF file
    const tempDir = path.join(__dirname, '../../public/temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const fileName = `cert-${userId}-${courseId}-${Date.now()}.pdf`;
    tempFilePath = path.join(tempDir, fileName);

    await generateCertificatePDF(certificateData, tempFilePath);

    // 7. Upload to Supabase
    const fileBuffer = fs.readFileSync(tempFilePath);
    const mockFile = {
      buffer: fileBuffer,
      originalname: fileName,
      mimetype: 'application/pdf'
    };

    const publicUrl = await uploadToSupabase(mockFile, 'certificates', 'generated');

    // 8. Create or update certificate record
    let certificate;
    const certId = generateCustomId('CERT');

    if (existingCert) {
      // Update existing pending certificate
      existingCert.certificate_url = publicUrl;
      existingCert.recipient_name = certificateData.recipient_name;
      existingCert.course_title = certificateData.course_title;
      existingCert.instructor_name = certificateData.instructor_name;
      existingCert.issued_at = new Date();
      existingCert.status = 'generated';
      await existingCert.save();
      certificate = existingCert;
    } else {
      // Create new certificate
      certificate = await Certificate.create({
        id: certId,
        user_id: userId,
        course_id: courseId,
        certificate_url: publicUrl,
        recipient_name: certificateData.recipient_name,
        course_title: certificateData.course_title,
        instructor_name: certificateData.instructor_name,
        issued_at: new Date(),
        total_hours: 0,
        status: 'generated'
      });
    }

    // 9. Cleanup temp file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    console.log('[autoGenerateCertificate] Certificate generated successfully:', certificate.id);
    return certificate;

  } catch (error) {
    console.error('[autoGenerateCertificate] Error:', error);
    
    // Cleanup temp file on error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.error('[autoGenerateCertificate] Error cleaning up temp file:', cleanupError);
      }
    }
    
    return null;
  }
};

module.exports = { autoGenerateCertificate };
