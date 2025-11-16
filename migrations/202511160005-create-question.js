// File: migrations/202511160005-create-question.js
'use strict';

/**
 * @typedef {import('sequelize').QueryInterface} QueryInterface
 * @typedef {import('sequelize').Sequelize} Sequelize
 */

module.exports = {
  /**
   * Fungsi 'up' dieksekusi ketika migrasi dijalankan.
   * Fungsi ini bertanggung jawab untuk membuat tabel 'Questions'.
   * Tabel ini menyimpan setiap pertanyaan yang terkait dengan 'Quiz'.
   *
   * @param {QueryInterface} queryInterface - Interface Query Sequelize
   * @param {Sequelize} Sequelize - Pustaka Sequelize
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Questions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER // Menggunakan ID integer standar, bukan kustom
      },
      quiz_id: {
        type: Sequelize.STRING(16),
        allowNull: false,
        references: {
          model: 'Quizzes', // Nama tabel induk
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // Jika Kuis dihapus, semua pertanyaan di dalamnya ikut terhapus
      },
      question_text: {
        type: Sequelize.TEXT, // Teks lengkap dari pertanyaan
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  /**
   * Fungsi 'down' dieksekGGFGFGFGsi ketika migrasi dibatalkan (rollback).
   * Fungsi ini bertanggung jawab untuk menghapus tabel 'Questions'.
   *
   * @param {QueryInterface} queryInterface - Interface Query Sequelize
   * @param {Sequelize} Sequelize - Pustaka Sequelize
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Questions');
  }
};