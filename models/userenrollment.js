// File: models/userenrollment.js
'use strict';
const { Model } = require('sequelize');
const { generateCustomId } = require('../src/utils/idGenerator');

module.exports = (sequelize, DataTypes) => {
  class UserEnrollment extends Model {
    static associate(models) {
      // Relasi ini didefinisikan di User dan LearningPath
    }
  }
  UserEnrollment.init({
    id: {
      type: DataTypes.STRING(16), // EN-XXXXXX
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
    midtrans_transaction_id: {
      type: DataTypes.STRING,
      allowNull: true, // Mungkin manual enrollment oleh admin
    },
    status: {
      type: DataTypes.ENUM('pending', 'success', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    enrolled_at: {
      type: DataTypes.DATE,
      allowNull: true, // Diisi saat status 'success'
    },
  }, {
    sequelize,
    modelName: 'UserEnrollment',
    timestamps: true,
    hooks: {
      beforeCreate: (enrollment, options) => {
        enrollment.id = generateCustomId('EN'); // Prefix 'EN'
      },
    },
  });
  return UserEnrollment;
};