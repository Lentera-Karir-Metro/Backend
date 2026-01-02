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
      // Course dapat berada di banyak LearningPath (many-to-many)
      Course.belongsToMany(models.LearningPath, { through: models.LearningPathCourse, foreignKey: 'course_id', otherKey: 'learning_path_id', as: 'learningPaths' });
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
      // Sebuah Course memiliki (hasMany) banyak UserEnrollment
      Course.hasMany(models.UserEnrollment, {
        foreignKey: 'course_id',
        as: 'enrollments', // Alias untuk relasi
      });
      // Sebuah Course belongs to satu Category
      Course.belongsTo(models.Category, {
        foreignKey: 'category_id',
        as: 'categoryData',
      });
      // Sebuah Course belongs to satu Mentor
      Course.belongsTo(models.Mentor, {
        foreignKey: 'mentor_id',
        as: 'mentorData',
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
    title: {
      type: DataTypes.STRING,
      allowNull: false, // Judul Course (misal: "Bab 1: Pengenalan")
    },
    description: {
      type: DataTypes.TEXT, // Deskripsi singkat tentang Course
    },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
    thumbnail_url: { type: DataTypes.STRING, allowNull: true },
    discount_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
    category: { type: DataTypes.STRING, allowNull: true, defaultValue: null }, // Legacy field
    category_id: { type: DataTypes.STRING(16), allowNull: true }, // FK to Category
    mentor_id: { type: DataTypes.STRING(16), allowNull: true }, // FK to Mentor
    mentor_name: { type: DataTypes.STRING, allowNull: true }, // Legacy field
    mentor_title: { type: DataTypes.STRING, allowNull: true }, // Legacy field
    mentor_photo_profile: { type: DataTypes.STRING, allowNull: true }, // Legacy field
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'published' },
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