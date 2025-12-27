'use strict';
const { Model } = require('sequelize');

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
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
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
    timestamps: true
  });

  return Question;
};
