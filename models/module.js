// File: models/module.js
'use strict';
const { Model } = require('sequelize');
// Impor helper untuk membuat ID kustom (misal: MD-XXXXXX)
const { generateCustomId } = require('../src/utils/idGenerator');

module.exports = (sequelize, DataTypes) => {
  /**
   * Model Module
   * Merepresentasikan unit pembelajaran terkecil (satu video, satu ebook, atau satu kuis).
   * Ini adalah level terbawah dalam hierarki konten.
   * Hierarki: LearningPath -> Course -> Module
   */
  class Module extends Model {
    /**
     * Helper method untuk mendefinisikan relasi.
     * Method ini otomatis dipanggil oleh `models/index.js`.
     * @param {object} models - Kumpulan semua model yang terdefinisi
     */
    static associate(models) {
      // Sebuah Module adalah bagian dari (belongsTo) satu Course
      Module.belongsTo(models.Course, {
        foreignKey: 'course_id',
        as: 'course', // Alias untuk relasi
      });

      // Sebuah Module (jika tipe=quiz) terhubung ke (belongsTo) satu Quiz
      Module.belongsTo(models.Quiz, {
        foreignKey: 'quiz_id',
        as: 'quiz',
      });
    }
  }

  /**
   * Inisialisasi model Module dengan skema database.
   */
  Module.init({
    id: {
      type: DataTypes.STRING(16), // Sesuai spesifikasi VARCHAR(16)
      allowNull: false,
      primaryKey: true,
      unique: true,
      defaultValue: () => generateCustomId('MD'),
    },
    course_id: {
      type: DataTypes.STRING(16),
      allowNull: false,
      references: {
        model: 'Courses', // Relasi ke tabel Courses
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE', // Jika Course dihapus, Module ikut terhapus
    },
    quiz_id: {
      type: DataTypes.STRING(16),
      allowNull: true,
      references: {
        model: 'Quizzes',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false, // Judul Modul (misal: "Video: Pengenalan Variabel")
    },
    // module_type removed
    sequence_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0, // Urutan modul dalam satu course. Penting untuk logika penguncian.
    },
    video_url: {
      type: DataTypes.STRING,
      allowNull: true, // Diisi jika module_type = 'video'. URL dari Supabase Storage.
    },
    ebook_url: {
      type: DataTypes.STRING,
      allowNull: true, // Diisi jika module_type = 'ebook'. URL dari Supabase Storage.
    },
    // quiz_id dihapus karena Quiz sekarang terpisah dari Module
    // durasi_video_menit removed per requirement
    // estimasi_waktu_menit removed per requirement
  }, {
    sequelize,
    modelName: 'Module',
    timestamps: true, // Otomatis menambah createdAt dan updatedAt

    // Definisikan 'hook' (fungsi) yang berjalan otomatis
    hooks: {
      /**
       * Hook 'beforeCreate' berjalan otomatis sebelum record baru disimpan ke DB.
       * Kita gunakan untuk men-generate ID kustom (MD-XXXXXX).
       * @param {Module} module - Instance modul yang akan dibuat
       */
      beforeCreate: (module, options) => {
        module.id = generateCustomId('MD'); // Prefix 'MD'
      },
    },
  });
  return Module;
};