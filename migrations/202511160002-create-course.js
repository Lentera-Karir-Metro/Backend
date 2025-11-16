// File: migrations/202511160002-create-course.js
'use strict';

/**
 * @typedef {import('sequelize').QueryInterface} QueryInterface
 * @typedef {import('sequelize').Sequelize} Sequelize
 */

module.exports = {
  /**
   * Fungsi 'up' dieksekusi ketika migrasi dijalankan.
   * Fungsi ini bertanggung jawab untuk membuat tabel 'Courses'.
   * 'Course' merepresentasikan satu bab atau bagian di dalam 'LearningPath'.
   * (Hierarki: LearningPath -> Course -> Module)
   *
   * @param {QueryInterface} queryInterface - Interface Query Sequelize
   * @param {Sequelize} Sequelize - Pustaka Sequelize
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Courses', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(16), // ID Kustom (misal: CR-XXXXXX)
      },
      learning_path_id: {
        type: Sequelize.STRING(16),
        allowNull: false,
        references: {
          model: 'LearningPaths', // Nama tabel induk
          key: 'id',
        },
        onUpdate: 'CASCADE', // Jika ID LearningPath berubah, update di sini
        onDelete: 'CASCADE', // Jika LearningPath dihapus, Course di dalamnya ikut terhapus
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false, // Judul Course (misal: "Bab 1: Instalasi Node.js")
      },
      description: {
        type: Sequelize.TEXT, // Deskripsi singkat tentang Course ini
      },
      sequence_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0, // Untuk menentukan urutan course (fitur drag-and-drop & logika penguncian)
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
   * Fungsi ini bertanggung jawab untuk menghapus tabel 'Courses'.
   *
   * @param {QueryInterface} queryInterface - Interface Query Sequelize
   * @param {Sequelize} Sequelize - Pustaka Sequelize
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Courses');
  }
};