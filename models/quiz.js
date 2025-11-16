// File: models/quiz.js
'use strict';
const { Model } = require('sequelize');
const { generateCustomId } = require('../src/utils/idGenerator');

module.exports = (sequelize, DataTypes) => {
  class Quiz extends Model {
    static associate(models) {
      // Quiz terhubung ke satu Module (jika module_type = 'quiz')
      Quiz.hasOne(models.Module, {
        foreignKey: 'quiz_id',
        as: 'module',
      });

      // Quiz memiliki banyak Question
      Quiz.hasMany(models.Question, {
        foreignKey: 'quiz_id',
        as: 'questions',
      });

      Quiz.hasMany(models.UserQuizAttempt, {
            foreignKey: 'quiz_id',
            as: 'attempts',
          });
    }
  }
  Quiz.init({
    id: {
      type: DataTypes.STRING(16), // QZ-XXXXXX
      allowNull: false,
      primaryKey: true,
      unique: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pass_threshold: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.75, // Syarat lulus 75%
    },
  }, {
    sequelize,
    modelName: 'Quiz',
    timestamps: true,
    hooks: {
      beforeCreate: (quiz, options) => {
        quiz.id = generateCustomId('QZ'); // Prefix 'QZ'
      },
    },
  });
  return Quiz;
};