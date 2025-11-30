// File: models/user.js
'use strict';
const { Model } = require('sequelize');
// PASTIKAN PATH INI BENAR:
const { generateCustomId } = require('../src/utils/idGenerator'); 
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsToMany(models.LearningPath, { through: models.UserEnrollment, foreignKey: 'user_id', as: 'enrolledLearningPaths' });
      User.hasMany(models.UserModuleProgress, { foreignKey: 'user_id', as: 'moduleProgresses' });
      User.hasMany(models.UserQuizAttempt, { foreignKey: 'user_id', as: 'quizAttempts' });
      User.hasMany(models.Certificate, { foreignKey: 'user_id', as: 'certificates' });
    }
  }
  User.init({
    id: {
    type: DataTypes.STRING(16),
    allowNull: false,
    primaryKey: true,
    unique: true,
    defaultValue: () => generateCustomId('LT')  
   },
    supabase_auth_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      allowNull: false,
      defaultValue: 'user',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
  }, {
    sequelize,
    modelName: 'User',
    timestamps: true,
    hooks: {
      beforeCreate: (user, options) => {
        // Hook ini WAJIB jalan untuk isi ID
        user.id = generateCustomId('LT'); 
      },
    },
  });
  return User;
};