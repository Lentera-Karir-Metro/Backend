// File: models/userenrollment.js
'use strict';
const { Model } = require('sequelize');
// Impor helper untuk membuat ID kustom (misal: EN-XXXXXX)
const { generateCustomId } = require('../src/utils/idGenerator');

module.exports = (sequelize, DataTypes) => {
  /**
   * Model UserEnrollment (Tabel Junction)
   * Merepresentasikan 'bukti pendaftaran' atau 'transaksi' yang menghubungkan
   * seorang User dengan sebuah LearningPath.
   *
   * Record di tabel ini dibuat oleh:
   * 1. Webhook Midtrans setelah pembayaran sukses.
   * 2. Admin secara manual (fitur 'Manual Enroll').
   */
  class UserEnrollment extends Model {
    /**
     * Helper method untuk mendefinisikan relasi.
     * Dalam kasus tabel junction ini, relasi utamanya (belongsToMany)
     * didefinisikan di model User dan LearningPath.
     * @param {object} models - Kumpulan semua model yang terdefinisi
     */
    static associate(models) {
      // Relasi 'belongsToMany' didefinisikan di model User dan LearningPath
      // yang menunjuk ke model 'UserEnrollment' ini sebagai 'through'.
    }
  }

  /**
   * Inisialisasi model UserEnrollment dengan skema database.
   */
  UserEnrollment.init({
    id: {
      type: DataTypes.STRING(16), // ID Kustom (misal: EN-XXXXXX)
      allowNull: false,
      primaryKey: true,
      unique: true,
    },
    user_id: {
      type: DataTypes.STRING(16),
      allowNull: false,
      references: { model: 'Users', key: 'id' }, // Relasi ke User
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    learning_path_id: {
      type: DataTypes.STRING(16),
      allowNull: false,
      references: { model: 'LearningPaths', key: 'id' }, // Relasi ke LearningPath
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    midtrans_transaction_id: {
      type: DataTypes.STRING,
      allowNull: true, // ID transaksi dari Midtrans. Nullable jika didaftarkan manual oleh admin.
    },
    status: {
      type: DataTypes.ENUM('pending', 'success', 'failed'), // Status pembayaran
      allowNull: false,
      defaultValue: 'pending',
    },
    enrolled_at: {
      type: DataTypes.DATE,
      allowNull: true, // Diisi dengan timestamp saat status diubah menjadi 'success'
    },
  }, {
    sequelize,
    modelName: 'UserEnrollment',
    timestamps: true, // Otomatis menambah createdAt dan updatedAt
    
    // Definisikan 'hook' (fungsi) yang berjalan otomatis
    hooks: {
      /**
       * Hook 'beforeCreate' berjalan otomatis sebelum record baru disimpan ke DB.
       * Kita gunakan untuk men-generate ID kustom (EN-XXXXXX).
       * @param {UserEnrollment} enrollment - Instance enrollment yang akan dibuat
       */
      beforeCreate: (enrollment, options) => {
        enrollment.id = generateCustomId('EN'); // Prefix 'EN'
      },
    },
  });
  return UserEnrollment;
};