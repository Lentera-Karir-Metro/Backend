// File: models/certificate.js
'use strict';
const { Model } = require('sequelize');
// Impor helper untuk membuat ID kustom (misal: CERT-XXXXXX)
const { generateCustomId } = require('../src/utils/idGenerator');

module.exports = (sequelize, DataTypes) => {
  /**
   * Model Certificate
   * Merepresentasikan sertifikat yang didapat pengguna setelah
   * menyelesaikan sebuah Learning Path.
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
      // Sebuah Sertifikat diberikan untuk satu LearningPath
      Certificate.belongsTo(models.LearningPath, { foreignKey: 'learning_path_id' });
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
      allowNull: false,
      references: { model: 'Users', key: 'id' }, // Relasi ke pemilik sertifikat
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    learning_path_id: {
      type: DataTypes.STRING(16),
      allowNull: false,
      references: { model: 'LearningPaths', key: 'id' }, // Relasi ke learning path yang diselesaikan
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    issued_at: {
      type: DataTypes.DATE, // Tanggal sertifikat diterbitkan
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    total_hours: {
      type: DataTypes.INTEGER, // Akumulasi (SUM) dari estimasi_waktu_menit
      allowNull: false,
    },
    certificate_url: {
      type: DataTypes.STRING, // URL unik ke halaman/file sertifikat
      allowNull: true,
    },
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