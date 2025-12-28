// File: seeders/202511160100-admin-seeder.js
'use strict';
const { generateCustomId } = require('../src/utils/idGenerator');
const bcrypt = require('bcryptjs');

// ====================================================================
// === KONFIGURASI ADMIN ===
// ####################################################################

const ADMIN_USERS = [
  { email: "dimasdrn21@gmail.com", username: "dimdim" },
  { email: "drn211103@gmail.com", username: "drn21" }
];
const ADMIN_PASSWORD = "dimasganteng"; // Password default jika user belum ada (akan dipakai untuk semua admin)

// ####################################################################

module.exports = {
  async up (queryInterface, Sequelize) {
    // Hash password terlebih dahulu (satu hash untuk semua admin default)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    for (const admin of ADMIN_USERS) {
      const email = admin.email;
      const username = admin.username || email.split('@')[0];

      // Cek apakah user dengan email ini sudah ada
      const existingUsers = await queryInterface.sequelize.query(
        `SELECT id FROM Users WHERE email = '${email}' LIMIT 1`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      if (existingUsers.length > 0) {
        // Jika sudah ada, UPDATE role DAN PASSWORD
        console.log(`User ${email} sudah ada. Mengupdate role dan password...`);
        await queryInterface.bulkUpdate('Users', 
          { 
            role: 'admin',
            password: hashedPassword,
            is_verified: true,
            updatedAt: new Date()
          },
          { email }
        );
      } else {
        // Jika belum ada, INSERT user baru sebagai admin
        console.log(`User ${email} belum ada. Membuat user admin baru...`);
        let adminUserId;
        try {
            adminUserId = generateCustomId('LT');
        } catch (e) {
            adminUserId = `LT-${Date.now()}`;
        }

        await queryInterface.bulkInsert('Users', [{
          id: adminUserId,
          email,
          username,
          password: hashedPassword,
          role: 'admin',
          is_verified: true,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        }]);
      }
    }
  },

  async down (queryInterface, Sequelize) {
    // Hapus kedua admin jika ada
    for (const admin of ADMIN_USERS) {
      await queryInterface.bulkDelete('Users', { email: admin.email }, {});
    }
  }
};