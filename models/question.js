// File: models/question.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  /**
   * Model Question
   * Merepresentasikan satu pertanyaan di dalam sebuah Quiz.
   * Model ini menggunakan ID integer standar (AUTO_INCREMENT).
   */
  class Question extends Model {
    /**
     * Helper method untuk mendefinisikan relasi.
     * Method ini otomatis dipanggil oleh `models/index.js`.
     * @param {object} models - Kumpulan semua model yang terdefinisi
     */
    static associate(models) {
      // Sebuah Pertanyaan adalah bagian dari (belongsTo) satu Quiz
      Question.belongsTo(models.Quiz, {
        foreignKey: 'quiz_id',
        as: 'quiz', // Alias untuk relasi
      });

      // Sebuah Pertanyaan memiliki (hasMany) banyak Option (pilihan jawaban)
      Question.hasMany(models.Option, {
        foreignKey: 'question_id',
        as: 'options', // Alias untuk relasi
      });
    }
  }

  /**
   * Inisialisasi model Question dengan skema database.
   */
  Question.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true, // Menggunakan ID standar yang bertambah otomatis
      primaryKey: true,
    },
    quiz_id: {
      type: DataTypes.STRING(16), // FK ke ID kustom Quiz (QZ-XXXXXX)
      allowNull: false,
      references: {
        model: 'Quizzes', // Relasi ke tabel Quizzes
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE', // Jika Quiz dihapus, Pertanyaan ikut terhapus
    },
    question_text: {
      type: DataTypes.TEXT, // Teks lengkap dari pertanyaan
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Question',
    timestamps: true, // Otomatis menambah createdAt dan updatedAt
    // Tidak ada hook 'beforeCreate' karena ID sudah auto-increment
  });
  return Question;
};