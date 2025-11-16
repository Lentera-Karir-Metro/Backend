// File: src/utils/idGenerator.js
/**
 * @fileoverview Utilitas untuk menghasilkan ID Kustom (VARCHAR(16))
 * yang diperlukan oleh entitas utama database.
 */

/**
 * @function generateCustomId
 * @description Menghasilkan ID unik kustom dengan format PREFIX-XXXXXX.
 * ID ini digunakan di 'beforeCreate' hook pada model Sequelize.
 * * @param {string} prefix - Prefix 2-5 karakter (misal: "LT" untuk User, "LP" untuk LearningPath)
 * @returns {string} ID kustom yang unik (misal: "LP-J9F6A3")
 */
const generateCustomId = (prefix) => {
  // 1. Menghasilkan string acak dalam basis 36 (mengandung angka dan huruf)
  const suffix = Math.random()
    .toString(36)
    .substring(2, 8) // 2. Mengambil 6 karakter acak
    .toUpperCase(); // 3. Mengubah menjadi huruf kapital
    
  // Gabungkan prefix dan suffix
  return `${prefix}-${suffix}`;
};

module.exports = { generateCustomId };