// File: migrations/202511160008-create-user-module-progress.js
'use strict';

/**
 * @typedef {import('sequelize').QueryInterface} QueryInterface
 * @typedef {import('sequelize').Sequelize} Sequelize
 */

module.exports = {
  /**
   * Fungsi 'up' dieksekusi ketika migrasi dijalankan.
   * Fungsi ini bertanggung jawab untuk membuat tabel 'UserModuleProgresses'.
   * Tabel ini mencatat modul mana saja yang telah diselesaikan oleh seorang pengguna.
   * Ini adalah inti dari logika "Tandai Selesai" dan
   * digunakan untuk memvalidasi penguncian (lock) modul/course berikutnya.
   *
   * @param {QueryInterface} queryInterface - Interface Query Sequelize
   * @param {Sequelize} Sequelize - Pustaka Sequelize
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserModuleProgresses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER // Menggunakan ID integer standar
      },
      user_id: {
        type: Sequelize.STRING(16),
        allowNull: false,
        references: { model: 'Users', key: 'id' }, // Foreign Key ke tabel Users
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // Jika User dihapus, progresnya ikut terhapus
      },
      module_id: {
        type: Sequelize.STRING(16),
        allowNull: false,
        references: { model: 'Modules', key: 'id' }, // Foreign Key ke tabel Modules
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // Jika Modul dihapus, progres terkait ikut terhapus
      },
      is_completed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true, // Keberadaan record di tabel ini sudah menandakan 'selesai'
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

    // Tambahkan constraint UNIQUE agar user tidak bisa menyelesaikan 1 modul 2x
    await queryInterface.addConstraint('UserModuleProgresses', {
      fields: ['user_id', 'module_id'],
      type: 'unique',
      name: 'user_module_unique_constraint'
    });
  },

  /**
   * Fungsi 'down' dieksekusi ketika migrasi dibatalkan (rollback).
   * Fungsi ini bertanggung jawab untuk menghapus tabel 'UserModuleProgresses'.
   *
   * @param {QueryInterface} queryInterface - Interface Query Sequelize
   * @param {Sequelize} Sequelize - Pustaka Sequelize
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UserModuleProgresses');
  }
};