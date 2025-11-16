// File: src/utils/idGenerator.js
const generateCustomId = (prefix) => {
  const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${suffix}`;
};
module.exports = { generateCustomId };