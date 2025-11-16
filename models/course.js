// File: models/course.js
'use strict';
const { Model } = require('sequelize');
const { generateCustomId } = require('../src/utils/idGenerator');

module.exports = (sequelize, DataTypes) => {
  class Course extends Model {
    static associate(models) {
      // Course adalah bagian dari satu LearningPath
      Course.belongsTo(models.LearningPath, {
        foreignKey: 'learning_path_id',
        as: 'learningPath',
      });
      // Course memiliki banyak Module
      Course.hasMany(models.Module, {
        foreignKey: 'course_id',
        as: 'modules',
      });
    }
  }
  Course.init({
    id: {
      type: DataTypes.STRING(16), // CR-XXXXXX
      allowNull: false,
      primaryKey: true,
      unique: true,
    },
    learning_path_id: {
      type: DataTypes.STRING(16),
      allowNull: false,
      references: {
        model: 'LearningPaths', // Nama tabel
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    sequence_order: {
      type: DataTypes.INTEGER, // Untuk drag-and-drop & penguncian
      allowNull: false,
      defaultValue: 0,
    },
  }, {
    sequelize,
    modelName: 'Course',
    timestamps: true,
    hooks: {
      beforeCreate: (course, options) => {
        course.id = generateCustomId('CR'); // Prefix 'CR'
      },
    },
  });
  return Course;
};