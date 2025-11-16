// File: models/question.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Question extends Model {
    static associate(models) {
      // Question adalah bagian dari satu Quiz
      Question.belongsTo(models.Quiz, {
        foreignKey: 'quiz_id',
        as: 'quiz',
      });

      // Question memiliki banyak Option
      Question.hasMany(models.Option, {
        foreignKey: 'question_id',
        as: 'options',
      });
    }
  }
  Question.init({
    id: { // Pakai ID standar (INT AUTO_INCREMENT)
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    quiz_id: {
      type: DataTypes.STRING(16), // FK ke QZ-XXXXXX
      allowNull: false,
      references: {
        model: 'Quizzes',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    question_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Question',
    timestamps: true,
  });
  return Question;
};