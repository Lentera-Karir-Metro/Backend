// File: models/learningpath.js
'use strict';
const { Model } = require('sequelize');
const { generateCustomId } = require('../src/utils/idGenerator');

module.exports = (sequelize, DataTypes) => {
  class LearningPath extends Model {
    static associate(models) {
      LearningPath.belongsToMany(models.Course, { through: models.LearningPathCourse, foreignKey: 'learning_path_id', otherKey: 'course_id', as: 'courses' });
      // `UserEnrollment` tidak lagi menyimpan `learning_path_id` (enrollment berbasis course)
    }
  }
  LearningPath.init({
    id: { type: DataTypes.STRING(16), allowNull: false, primaryKey: true, unique: true, defaultValue: () => generateCustomId('LP') },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    thumbnail: { type: DataTypes.STRING, allowNull: true },
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