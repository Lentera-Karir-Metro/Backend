// File: src/controllers/certificateController.js
/**
 * @fileoverview Certificate Controller - Menangani sertifikat user
 */
const db = require('../../models');
const { Certificate, LearningPath, User } = db;

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
          model: LearningPath,
          attributes: ['id', 'title', 'description', 'thumbnail_url', 'category']
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
 * @function getCertificateById
 * @description Mengambil detail sertifikat berdasarkan ID
 * @route GET /api/v1/certificates/:id
 */
exports.getCertificateById = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  
  try {
    const certificate = await Certificate.findOne({
      where: { id, user_id: userId },
      include: [
        {
          model: LearningPath,
          attributes: ['id', 'title', 'description', 'category']
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
