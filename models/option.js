'use strict';
const { Model } = require('sequelize');
const { generateCustomId } = require('../src/utils/idGenerator');

module.exports = (sequelize, DataTypes) => {
  class Option extends Model {
    static associate(models) {
      Option.belongsTo(models.Question, {
        foreignKey: 'question_id',
        as: 'question',
      });
    }
  }

  Option.init({
    id: {
      type: DataTypes.STRING(16),
      allowNull: false,
      primaryKey: true,
      unique: true,
    },
    question_id: {
      type: DataTypes.STRING(16),
      allowNull: false,
      references: {
        model: 'Questions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    option_text: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    is_correct: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Option',
    timestamps: true,
    hooks: {
      beforeCreate: (opt, options) => {
        if (!opt.id) {
          opt.id = generateCustomId('OP');
        }
      }
    }
  });

  return Option;
};
