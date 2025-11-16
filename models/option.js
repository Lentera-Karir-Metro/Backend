// File: models/option.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Option extends Model {
    static associate(models) {
      // Option adalah bagian dari satu Question
      Option.belongsTo(models.Question, {
        foreignKey: 'question_id',
        as: 'question',
      });
    }
  }
  Option.init({
    id: { // Pakai ID standar (INT AUTO_INCREMENT)
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    question_id: {
      type: DataTypes.INTEGER, // FK ke Question.id
      allowNull: false,
      references: {
        model: 'Questions',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    option_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_correct: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  }, {
    sequelize,
    modelName: 'Option',
    timestamps: true,
  });
  return Option;
};