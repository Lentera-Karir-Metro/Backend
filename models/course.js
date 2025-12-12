// File: models/course.js
'use strict';
const { Model } = require('sequelize');
// Impor helper untuk membuat ID kustom (misal: CR-XXXXXX)
const { generateCustomId } = require('../src/utils/idGenerator');

module.exports = (sequelize, DataTypes) => {
  /**
   * Model Course
   * Merepresentasikan satu 'bab' atau 'bagian' di dalam sebuah LearningPath.
   * Hierarki: LearningPath -> Course -> Module
   */
  class Course extends Model {
    /**
     * Helper method untuk mendefinisikan relasi.
     * Method ini otomatis dipanggil oleh `models/index.js`.
     * @param {object} models - Kumpulan semua model yang terdefinisi
     */
    static associate(models) {
      // Sebuah Course adalah bagian dari (belongsTo) satu LearningPath
      Course.belongsTo(models.LearningPath, {
        foreignKey: 'learning_path_id',
        as: 'learningPath', // Alias untuk relasi
      });
      // Sebuah Course memiliki (hasMany) banyak Module
      Course.hasMany(models.Module, {
        foreignKey: 'course_id',
        as: 'modules', // Alias untuk relasi
      });
      // Sebuah Course memiliki (hasMany) banyak Quiz
      Course.hasMany(models.Quiz, {
        foreignKey: 'course_id',
        as: 'quizzes', // Alias untuk relasi
      });
    }
  }

  /**
   * Inisialisasi model Course dengan skema database.
   */
  Course.init({
    id: {
      type: DataTypes.STRING(16), // Sesuai spesifikasi VARCHAR(16)
      allowNull: false,
      primaryKey: true,
      unique: true,
      defaultValue: () => generateCustomId('CR')
      
    },
    learning_path_id: {
      type: DataTypes.STRING(16),
      allowNull: false,
      references: {
        model: 'LearningPaths', // Relasi ke tabel LearningPaths
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE', // Jika LearningPath dihapus, Course ikut terhapus
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false, // Judul Course (misal: "Bab 1: Pengenalan")
    },
    description: {
      type: DataTypes.TEXT, // Deskripsi singkat tentang Course
    },
    sequence_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0, // Urutan Course. Penting untuk logika penguncian & drag-and-drop.
    },
  }, {
    sequelize,
    modelName: 'Course',
    timestamps: true, // Otomatis menambah createdAt dan updatedAt
    
    // Definisikan 'hook' (fungsi) yang berjalan otomatis
    hooks: {
      /**
       * Hook 'beforeCreate' berjalan otomatis sebelum record baru disimpan ke DB.
       * Kita gunakan untuk men-generate ID kustom (CR-XXXXXX).
       * @param {Course} course - Instance course yang akan dibuat
       */
      beforeCreate: (course, options) => {
        course.id = generateCustomId('CR'); // Prefix 'CR'
      },
    },
  });
  return Course;
};