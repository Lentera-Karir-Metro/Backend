// File: models/certificate.js
'use strict';
const { Model } = require('sequelize');
// Impor helper untuk membuat ID kustom (misal: CERT-XXXXXX)
const { generateCustomId } = require('../src/utils/idGenerator');

module.exports = (sequelize, DataTypes) => {
  /**
   * Model Certificate
   * Merepresentasikan sertifikat yang didapat pengguna setelah
   * menyelesaikan sebuah Learning Path secara keseluruhan.
   */
  class Certificate extends Model {
    /**
     * Helper method untuk mendefinisikan relasi.
     * Method ini otomatis dipanggil oleh `models/index.js`.
     * @param {object} models - Kumpulan semua model yang terdefinisi
     */
    static associate(models) {
      // Sebuah Sertifikat dimiliki oleh satu User
      Certificate.belongsTo(models.User, { foreignKey: 'user_id' });
      // Sebuah Sertifikat diberikan untuk satu Course (produk)
      Certificate.belongsTo(models.Course, { foreignKey: 'course_id', as: 'Course' });
    }
  }
  
  Certificate.init({
    id: {
      type: DataTypes.STRING(16), // Sesuai spesifikasi VARCHAR(16)
      allowNull: false,
      primaryKey: true,
      unique: true,
    },
    user_id: {
      type: DataTypes.STRING(16),
      allowNull: true, // Changed to true for manual generation
      references: { model: 'Users', key: 'id' }, 
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    // legacy learning_path_id removed; certificates are course-first now
    recipient_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    course_title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    instructor_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    issued_at: {
      type: DataTypes.DATE, // Tanggal sertifikat diterbitkan
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    total_hours: {
      type: DataTypes.INTEGER, // Akumulasi (SUM) dari estimasi_waktu_menit semua modul
      allowNull: false,
    },
    certificate_url: {
      type: DataTypes.STRING, // URL publik ke file/halaman sertifikat (opsional)
      allowNull: true,
    },
    course_id: {
      type: DataTypes.STRING(16),
      allowNull: true,
      references: { model: 'Courses', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    status: {
      type: DataTypes.ENUM('pending','generated'),
      allowNull: false,
      defaultValue: 'pending'
    }
  }, {
    sequelize,
    modelName: 'Certificate',
    timestamps: true, // Otomatis menambah createdAt dan updatedAt
    
    // Definisikan 'hook' (fungsi) yang berjalan otomatis
    hooks: {
      /**
       * Hook 'beforeCreate' berjalan otomatis sebelum record baru disimpan ke DB.
       * Kita gunakan untuk men-generate ID kustom (CERT-XXXXXX).
       * @param {Certificate} certificate - Instance sertifikat yang akan dibuat
       */
      beforeCreate: (certificate, options) => {
        certificate.id = generateCustomId('CERT'); // Prefix 'CERT'
      },
    },
  });
  return Certificate;
};