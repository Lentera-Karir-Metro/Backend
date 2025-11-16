// File: models/option.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  /**
   * Model Option
   * Merepresentasikan satu pilihan jawaban (misal: A, B, C, D) 
   * untuk sebuah 'Question'.
   * Model ini menggunakan ID integer standar (AUTO_INCREMENT).
   */
  class Option extends Model {
    /**
     * Helper method untuk mendefinisikan relasi.
     * Method ini otomatis dipanggil oleh `models/index.js`.
     * @param {object} models - Kumpulan semua model yang terdefinisi
     */
    static associate(models) {
      // Sebuah Opsi adalah bagian dari (belongsTo) satu Pertanyaan (Question)
      Option.belongsTo(models.Question, {
        foreignKey: 'question_id',
        as: 'question', // Alias untuk relasi
      });
    }
  }

  /**
   * Inisialisasi model Option dengan skema database.
   */
  Option.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true, // Menggunakan ID standar yang bertambah otomatis
      primaryKey: true,
    },
    question_id: {
      type: DataTypes.INTEGER, // FK ke ID integer Question
      allowNull: false,
      references: {
        model: 'Questions', // Relasi ke tabel Questions
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE', // Jika Pertanyaan dihapus, Opsi ikut terhapus
    },
    option_text: {
      type: DataTypes.TEXT, // Teks pilihan jawaban (misal: "Jawabannya adalah A")
      allowNull: false,
    },
    is_correct: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false, // Menandai apakah ini adalah opsi jawaban yang benar
    },
  }, {
    sequelize,
    modelName: 'Option',
    timestamps: true, // Otomatis menambah createdAt dan updatedAt
    // Tidak ada hook 'beforeCreate' karena ID sudah auto-increment
  });
  return Option;
};