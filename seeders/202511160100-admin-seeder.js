// File: seeders/202511160100-admin-seeder.js
'use strict';
const { generateCustomId } = require('../src/utils/idGenerator');

// ====================================================================
// === KONFIGURASI ADMIN ===
// ####################################################################

/**
 * @const {string} ADMIN_SUPABASE_UID - ID unik yang didapat dari Supabase Auth setelah pendaftaran manual.
 * Kunci ini menghubungkan user di Supabase dengan role 'admin' di MySQL.
 */
const ADMIN_SUPABASE_UID = "1dcef0f9-f66f-41c3-b6ec-04dabcef4852";
const ADMIN_EMAIL = "daffaraelanaqiali30@gmail.com"; // Email user yang didaftarkan di Supabase
const ADMIN_NAME = "Admin Daffarael";

// ####################################################################

module.exports = {
  /**
   * Fungsi 'up' bertanggung jawab untuk menambahkan user admin ke tabel Users.
   * Ini menggunakan 'bulkInsert' dengan opsi 'updateOnDuplicate' (upsert)
   * untuk memastikan role 'admin' selalu diterapkan.
   * * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize').Sequelize} Sequelize
   */
  async up (queryInterface, Sequelize) {
    // Cek keamanan: Pastikan UID sudah diubah dari placeholder
    if (!ADMIN_SUPABASE_UID || ADMIN_SUPABASE_UID === "PASTE_UID_ANDA_DARI_SUPABASE_DI_SINI") {
      throw new Error("Harap masukkan ADMIN_SUPABASE_UID di file seeder/202511160100-admin-seeder.js");
    }

    // Buat ID kustom untuk user MySQL (misal: LT-XXXXXX)
    const adminUserId = generateCustomId('LT');

    await queryInterface.bulkInsert('Users', [
      {
        id: adminUserId,
        supabase_auth_id: ADMIN_SUPABASE_UID,
        email: ADMIN_EMAIL,
        nama_lengkap: ADMIN_NAME,
        role: 'admin', // <-- Peran paksa (forced role) untuk user admin
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ], {
      // Jika user sudah pernah disinkronisasi/dibuat (konflik pada supabase_auth_id),
      // update record yang sudah ada dan pastikan 'role' di-set ke 'admin'.
      updateOnDuplicate: ['role', 'updatedAt'] 
    });
  },

  /**
   * Fungsi 'down' bertanggung jawab untuk menghapus data yang di-seed.
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize').Sequelize} Sequelize
   */
  async down (queryInterface, Sequelize) {
    // Hapus admin yang di-seed berdasarkan UID Supabase
    await queryInterface.bulkDelete('Users', {
      supabase_auth_id: ADMIN_SUPABASE_UID
    }, {});
  }
};