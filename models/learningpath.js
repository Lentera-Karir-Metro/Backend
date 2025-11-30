// File: models/learningpath.js
'use strict';
const { Model } = require('sequelize');
const { generateCustomId } = require('../src/utils/idGenerator');

module.exports = (sequelize, DataTypes) => {
  class LearningPath extends Model {
    static associate(models) {
      LearningPath.hasMany(models.Course, { foreignKey: 'learning_path_id', as: 'courses' });
      LearningPath.belongsToMany(models.User, { through: models.UserEnrollment, foreignKey: 'learning_path_id', as: 'enrolledUsers' });
      LearningPath.hasMany(models.Certificate, { foreignKey: 'learning_path_id', as: 'certificates' });
    }
  }
  LearningPath.init({
    id: { type: DataTypes.STRING(16), allowNull: false, primaryKey: true, unique: true, defaultValue: () => generateCustomId('LP') },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
    discount_amount: {type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
    thumbnail_url: { type: DataTypes.STRING, allowNull: true },
    rating: { type: DataTypes.FLOAT, defaultValue: 0.0 },
    review_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    category: { type: DataTypes.STRING, allowNull: false, defaultValue: "General" },
    level: { type: DataTypes.STRING, defaultValue: 'Beginner' },
    mentor_name: { type: DataTypes.STRING },
    mentor_title: { type: DataTypes.STRING },
    mentor_avatar_url: { type: DataTypes.STRING },
  }, {
    sequelize,
    modelName: 'LearningPath',
    timestamps: true,
    hooks: {
      beforeCreate: (lp, options) => {
        lp.id = generateCustomId('LP');
      },
    },
  });
  return LearningPath;
};