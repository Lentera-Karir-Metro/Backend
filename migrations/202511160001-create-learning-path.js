// File: migrations/202511160001-create-learning-path.js
'use strict';

/**
 * @typedef {import('sequelize').QueryInterface} QueryInterface
 * @typedef {import('sequelize').Sequelize} Sequelize
 */

module.exports = {
  /**
   * Fungsi 'up' dieksekusi ketika migrasi dijalankan.
   * Fungsi ini bertanggung jawab untuk membuat tabel 'LearningPaths'.
   * 'LearningPath' adalah entitas utama yang akan dibeli oleh pengguna.
   *
   * @param {QueryInterface} queryInterface - Interface Query Sequelize
   * @param {Sequelize} Sequelize - Pustaka Sequelize
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('LearningPaths', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(16), // ID Kustom (misal: LP-XXXXXX)
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false, // Judul Learning Path (misal: "Belajar Backend Node.js")
      },
      description: {
        type: Sequelize.TEXT, // Deskripsi lengkap tentang learning path
      },
      price: {
        type: Sequelize.DECIMAL(10, 2), // Menyimpan harga (misal: 150000.00)
        allowNull: false,
        defaultValue: 0.00,
      },
      thumbnail_url: {
        type: Sequelize.STRING,
        allowNull: true, // URL publik ke gambar thumbnail di Supabase Storage
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
   * Fungsi 'down' dieksekusi ketika migrasi dibatalkan (rollback).
   * Fungsi ini bertanggung jawab untuk menghapus tabel 'LearningPaths'.
   *
   * @param {QueryInterface} queryInterface - Interface Query Sequelize
   * @param {Sequelize} Sequelize - Pustaka Sequelize
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('LearningPaths');
  }
};