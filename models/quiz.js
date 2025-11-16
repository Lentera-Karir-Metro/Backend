// File: models/quiz.js
'use strict';
const { Model } = require('sequelize');
// Impor helper untuk membuat ID kustom (misal: QZ-XXXXXX)
const { generateCustomId } = require('../src/utils/idGenerator');

module.exports = (sequelize, DataTypes) => {
  /**
   * Model Quiz
   * Merepresentasikan "master" dari sebuah kuis.
   * Model ini terhubung ke Modul, dan memiliki banyak Pertanyaan.
   */
  class Quiz extends Model {
    /**
     * Helper method untuk mendefinisikan relasi.
     * Method ini otomatis dipanggil oleh `models/index.js`.
     * @param {object} models - Kumpulan semua model yang terdefinisi
     */
    static associate(models) {
      // Sebuah Kuis (secara opsional) terhubung ke (hasOne) satu Modul
      Quiz.hasOne(models.Module, {
        foreignKey: 'quiz_id',
        as: 'module', // Alias untuk relasi
      });

      // Sebuah Kuis memiliki (hasMany) banyak Pertanyaan
      Quiz.hasMany(models.Question, {
        foreignKey: 'quiz_id',
        as: 'questions', // Alias untuk relasi
      });

      // Sebuah Kuis dapat memiliki (hasMany) banyak Upaya Pengerjaan (Attempts)
      Quiz.hasMany(models.UserQuizAttempt, {
        foreignKey: 'quiz_id',
        as: 'attempts', // Alias untuk relasi
      });
    }
  }

  /**
   * Inisialisasi model Quiz dengan skema database.
   */
  Quiz.init({
    id: {
      type: DataTypes.STRING(16), // Sesuai spesifikasi VARCHAR(16)
      allowNull: false,
      primaryKey: true,
      unique: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false, // Judul Kuis
    },
    pass_threshold: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.75, // Syarat lulus 75%
    },
  }, {
    sequelize,
    modelName: 'Quiz',
    timestamps: true, // Otomatis menambah createdAt dan updatedAt
    
    // Definisikan 'hook' (fungsi) yang berjalan otomatis
    hooks: {
      /**
       * Hook 'beforeCreate' berjalan otomatis sebelum record baru disimpan ke DB.
       * Kita gunakan untuk men-generate ID kustom (QZ-XXXXXX).
       * @param {Quiz} quiz - Instance kuis yang akan dibuat
       */
      beforeCreate: (quiz, options) => {
        quiz.id = generateCustomId('QZ'); // Prefix 'QZ'
      },
    },
  });
  return Quiz;
};