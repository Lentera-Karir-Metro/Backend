// src/utils/idGenerator.js
/**
 * generateCustomId(prefix)
 * Menghasilkan ID dengan format PREFIX-XXXXXX (6 digit angka).
 * Contoh: LT-123456
 */

const pad = (num, size) => {
  let s = String(num);
  while (s.length < size) s = '0' + s;
  return s;
};

const generateCustomId = (prefix) => {
  // angka 6 digit acak (100000..999999) — memastikan leading zero tidak terjadi
  const suffix = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${pad(suffix, 6)}`;
};

module.exports = { generateCustomId };
