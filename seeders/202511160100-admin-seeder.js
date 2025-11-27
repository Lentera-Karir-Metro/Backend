// File: seeders/202511160100-admin-seeder.js
'use strict';
const { generateCustomId } = require('../src/utils/idGenerator');

// ====================================================================
// === KONFIGURASI ADMIN ===
// ####################################################################

/**
 * @const {string} ADMIN_SUPABASE_UID - ID unik yang didapat dari Supabase Auth.
 * Kunci ini menghubungkan user di Supabase dengan role 'admin' di MySQL.
 */
const ADMIN_SUPABASE_UID = "1dcef0f9-f66f-41c3-b6ec-04dabcef4852";
const ADMIN_EMAIL = "daffaraelanaqiali30@gmail.com";
const ADMIN_USERNAME = "Admin Daffarael";

// ####################################################################

module.exports = {
  /**
   * Fungsi 'up' menambahkan user admin ke tabel Users.
   * Menggunakan 'bulkInsert' dengan 'updateOnDuplicate' untuk memastikan
   * role 'admin' selalu diterapkan jika user sudah ada.
   * * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize').Sequelize} Sequelize
   */
  async up (queryInterface, Sequelize) {
    // Cek keamanan: Pastikan UID sudah diubah dari placeholder
    if (!ADMIN_SUPABASE_UID || ADMIN_SUPABASE_UID.includes("PASTE_UID")) {
      throw new Error("Harap masukkan ADMIN_SUPABASE_UID di file seeder.");
    }

    // Buat ID kustom untuk user MySQL (misal: LT-XXXXXX)
    const adminUserId = generateCustomId('LT');

    await queryInterface.bulkInsert('Users', [
      {
        id: adminUserId,
        supabase_auth_id: ADMIN_SUPABASE_UID,
        email: ADMIN_EMAIL,
        username: ADMIN_USERNAME, // Menggunakan kolom 'username' sesuai skema terbaru
        role: 'admin', // <-- Peran paksa (forced role) untuk user admin
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ], {
      // Jika user sudah ada (konflik pada supabase_auth_id), update role-nya saja
      updateOnDuplicate: ['role', 'updatedAt', 'username'] 
    });
  },

  /**
   * Fungsi 'down' menghapus data admin yang di-seed.
   * * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize').Sequelize} Sequelize
   */
  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', {
      supabase_auth_id: ADMIN_SUPABASE_UID
    }, {});
  }
};