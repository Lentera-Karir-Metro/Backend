// File: models/learningpath.js
'use strict';
const { Model } = require('sequelize');
const { generateCustomId } = require('../src/utils/idGenerator');

module.exports = (sequelize, DataTypes) => {
  class LearningPath extends Model {
    static associate(models) {
      LearningPath.hasMany(models.Course, {
        foreignKey: 'learning_path_id',
        as: 'courses',
      });

      LearningPath.belongsToMany(models.User, {
        through: models.UserEnrollment, // Gunakan model UserEnrollment
        foreignKey: 'learning_path_id',
        as: 'enrolledUsers',
      });

      LearningPath.hasMany(models.Certificate, {
            foreignKey: 'learning_path_id',
            as: 'certificates',
          });
    }
  }
  LearningPath.init({
    id: {
      type: DataTypes.STRING(16), // LP-XXXXXX
      allowNull: false,
      primaryKey: true,
      unique: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2), // Untuk harga
      allowNull: false,
      defaultValue: 0.00,
    },
    thumbnail_url: {
      type: DataTypes.STRING, // URL publik dari Supabase Storage
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'LearningPath',
    timestamps: true,
    hooks: {
      beforeCreate: (lp, options) => {
        lp.id = generateCustomId('LP'); // Prefix 'LP'
      },
    },
  });
  return LearningPath;
};