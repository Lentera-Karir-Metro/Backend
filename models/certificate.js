// File: models/certificate.js
'use strict';
const { Model } = require('sequelize');
const { generateCustomId } = require('../src/utils/idGenerator');

module.exports = (sequelize, DataTypes) => {
  class Certificate extends Model {
    static associate(models) {
      Certificate.belongsTo(models.User, { foreignKey: 'user_id' });
      Certificate.belongsTo(models.LearningPath, { foreignKey: 'learning_path_id' });
    }
  }
  Certificate.init({
    id: {
      type: DataTypes.STRING(16), // CERT-XXXXXX
      allowNull: false,
      primaryKey: true,
      unique: true,
    },
    user_id: {
      type: DataTypes.STRING(16),
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    learning_path_id: {
      type: DataTypes.STRING(16),
      allowNull: false,
      references: { model: 'LearningPaths', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    issued_at: {
      type: DataTypes.DATE, // Tanggal sertifikat diterbitkan
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    total_hours: {
      type: DataTypes.INTEGER, // Akumulasi SUM(estimasi_waktu_menit)
      allowNull: false,
    },
    certificate_url: {
      type: DataTypes.STRING, // URL unik ke halaman/file sertifikat
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Certificate',
    timestamps: true, // Otomatis createdAt dan updatedAt
    hooks: {
      beforeCreate: (certificate, options) => {
        certificate.id = generateCustomId('CERT'); // Prefix 'CERT'
      },
    },
  });
  return Certificate;
};