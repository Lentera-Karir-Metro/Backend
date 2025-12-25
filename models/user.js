// File: models/user.js
'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');
// PASTIKAN PATH INI BENAR:
const { generateCustomId } = require('../src/utils/idGenerator'); 
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsToMany(models.LearningPath, { through: models.UserEnrollment, foreignKey: 'user_id', as: 'enrolledLearningPaths' });
      User.hasMany(models.UserEnrollment, { foreignKey: 'user_id', as: 'enrollments' });
      User.hasMany(models.UserModuleProgress, { foreignKey: 'user_id', as: 'moduleProgresses' });
      User.hasMany(models.UserQuizAttempt, { foreignKey: 'user_id', as: 'quizAttempts' });
      User.hasMany(models.Certificate, { foreignKey: 'user_id', as: 'certificates' });
    }
    
    async validatePassword(password) {
      if (!this.password) return false;
      return await bcrypt.compare(password, this.password);
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
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
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
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    verification_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'User',
    timestamps: true,
    hooks: {
      beforeCreate: async (user, options) => {
        // Hook ini WAJIB jalan untuk isi ID
        user.id = generateCustomId('LT'); 
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user, options) => {
        if (user.changed('password')) {
          // Pastikan password ada isinya sebelum di-hash
          if (user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        }
      }
    },
  });
  return User;
};