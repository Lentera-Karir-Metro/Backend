'use strict';
const { Model } = require('sequelize');
const { generateCustomId } = require('../src/utils/idGenerator');

module.exports = (sequelize, DataTypes) => {
  class Question extends Model {
    static associate(models) {
      Question.belongsTo(models.Quiz, {
        foreignKey: 'quiz_id',
        as: 'quiz',
      });
      Question.hasMany(models.Option, {
        foreignKey: 'question_id',
        as: 'options',
      });
    }
  }

  Question.init({
    id: {
      type: DataTypes.STRING(16),
      allowNull: false,
      primaryKey: true,
      unique: true,
    },
    quiz_id: {
      type: DataTypes.STRING(16),
      allowNull: false,
      references: {
        model: 'Quizzes',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    question_text: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    question_type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'multiple_choice'
    }
  }, {
    sequelize,
    modelName: 'Question',
    timestamps: true,
    hooks: {
      beforeCreate: (question, options) => {
        if (!question.id) {
          question.id = generateCustomId('QN');
        }
      }
    }
  });

  return Question;
};
