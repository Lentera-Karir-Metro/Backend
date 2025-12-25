// File: models/quiz.js
'use strict';
const { Model } = require('sequelize');
// Impor helper untuk membuat ID kustom (misal: QZ-XXXXXX)
const { generateCustomId } = require('../src/utils/idGenerator');

module.exports = (sequelize, DataTypes) => {
  /**
   * Model Quiz
   * Merepresentasikan "master" dari sebuah kuis.
   * Model ini menyimpan aturan dasar kuis (judul, syarat lulus) dan
   * bertindak sebagai wadah untuk Pertanyaan (Questions).
   *
   * Kuis ini bersifat reusable: satu Quiz Master bisa ditautkan ke
   * berbagai Modul berbeda.
   */
  class Quiz extends Model {
    /**
     * Helper method untuk mendefinisikan relasi.
     * Method ini otomatis dipanggil oleh `models/index.js`.
     * @param {object} models - Kumpulan semua model yang terdefinisi
     */
    static associate(models) {
      // Sebuah Kuis (secara opsional) terhubung ke (hasOne) satu Modul
      // Relasi ini memungkinkan kita melihat di modul mana kuis ini dipakai
      Quiz.hasOne(models.Module, {
        foreignKey: 'quiz_id',
        as: 'module', // Alias untuk relasi
      });

      // Sebuah Kuis adalah bagian dari (belongsTo) satu Course
      Quiz.belongsTo(models.Course, {
        foreignKey: 'course_id',
        as: 'course',
      });

      // Sebuah Kuis memiliki (hasMany) banyak Pertanyaan
      // Jika Kuis dihapus, pertanyaan di dalamnya ikut terhapus (Cascade)
      Quiz.hasMany(models.Question, {
        foreignKey: 'quiz_id',
        as: 'questions', // Alias untuk relasi
      });

      // Sebuah Kuis dapat memiliki (hasMany) banyak Upaya Pengerjaan (Attempts)
      // Ini menyimpan riwayat user yang mengerjakan kuis ini
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
      defaultValue: () => generateCustomId('QZ'),
    },
    course_id: {
      type: DataTypes.STRING(16),
      allowNull: true,
      references: {
        model: 'Courses',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false, // Judul Kuis (misal: "Evaluasi Akhir Bab 1")
    },
    pass_threshold: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.75, // Syarat lulus 75% (0.75)
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0, // 0 = Unlimited
    },
    max_attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0, // 0 = Unlimited
    },
    sequence_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
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