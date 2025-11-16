// File: models/usermoduleprogress.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserModuleProgress extends Model {
    static associate(models) {
      UserModuleProgress.belongsTo(models.User, { foreignKey: 'user_id' });
      UserModuleProgress.belongsTo(models.Module, { foreignKey: 'module_id' });
    }
  }
  UserModuleProgress.init({
    id: { // Pakai ID standar (INT AUTO_INCREMENT)
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    user_id: {
      type: DataTypes.STRING(16),
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    module_id: {
      type: DataTypes.STRING(16),
      allowNull: false,
      references: { model: 'Modules', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    is_completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    sequelize,
    modelName: 'UserModuleProgress',
    timestamps: true, // Otomatis createdAt dan updatedAt
  });
  return UserModuleProgress;
};