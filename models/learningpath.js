// File: models/learningpath.js
'use strict';
const { Model } = require('sequelize');
// Impor helper untuk membuat ID kustom (misal: LP-XXXXXX)
const { generateCustomId } = require('../src/utils/idGenerator');

module.exports = (sequelize, DataTypes) => {
  /**
   * Model LearningPath
   * Merepresentasikan entitas "paket pembelajaran" utama yang dapat dibeli
   * oleh pengguna. Ini adalah 'induk' dari semua Course dan Modul.
   */
  class LearningPath extends Model {
    /**
     * Helper method untuk mendefinisikan relasi.
     * Method ini otomatis dipanggil oleh `models/index.js`.
     * @param {object} models - Kumpulan semua model yang terdefinisi
     */
    static associate(models) {
      // Sebuah LearningPath memiliki (hasMany) banyak Course
      LearningPath.hasMany(models.Course, {
        foreignKey: 'learning_path_id',
        as: 'courses', // Alias untuk relasi
      });

      // Sebuah LearningPath dapat dimiliki oleh (belongsToMany) banyak User
      // melalui tabel 'UserEnrollment' (bukti pendaftaran/pembelian)
      LearningPath.belongsToMany(models.User, {
        through: models.UserEnrollment, // Menggunakan model UserEnrollment sebagai tabel perantara
        foreignKey: 'learning_path_id',
        as: 'enrolledUsers', // Alias untuk relasi
      });

      // Sebuah LearningPath dapat menghasilkan (hasMany) banyak Certificate
      LearningPath.hasMany(models.Certificate, {
        foreignKey: 'learning_path_id',
        as: 'certificates', // Alias untuk relasi
      });
    }
  }

  /**
   * Inisialisasi model LearningPath dengan skema database.
   */
  LearningPath.init({
    id: {
      type: DataTypes.STRING(16), // Sesuai spesifikasi VARCHAR(16)
      allowNull: false,
      primaryKey: true,
      unique: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false, // Judul Learning Path (misal: "Fullstack Web Developer")
    },
    description: {
      type: DataTypes.TEXT, // Deskripsi lengkap
    },
    price: {
      type: DataTypes.DECIMAL(10, 2), // Harga, format 10 digit dengan 2 desimal
      allowNull: false,
      defaultValue: 0.00,
    },
    thumbnail_url: {
      type: DataTypes.STRING, // URL publik ke thumbnail di Supabase Storage
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'LearningPath',
    timestamps: true, // Otomatis menambah createdAt dan updatedAt
    
    // Definisikan 'hook' (fungsi) yang berjalan otomatis
    hooks: {
      /**
       * Hook 'beforeCreate' berjalan otomatis sebelum record baru disimpan ke DB.
       * Kita gunakan untuk men-generate ID kustom (LP-XXXXXX).
       * @param {LearningPath} lp - Instance learning path yang akan dibuat
       */
      beforeCreate: (lp, options) => {
        lp.id = generateCustomId('LP'); // Prefix 'LP'
      },
    },
  });
  return LearningPath;
};