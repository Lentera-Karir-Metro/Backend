// File: models/userquizanswer.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserQuizAnswer extends Model {
    static associate(models) {
      UserQuizAnswer.belongsTo(models.UserQuizAttempt, { foreignKey: 'user_quiz_attempt_id' });
      UserQuizAnswer.belongsTo(models.Question, { foreignKey: 'question_id' });
      UserQuizAnswer.belongsTo(models.Option, { foreignKey: 'selected_option_id' });
    }
  }
  UserQuizAnswer.init({
    id: { // Pakai ID standar (INT AUTO_INCREMENT)
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    user_quiz_attempt_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'UserQuizAttempts', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    question_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Questions', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    selected_option_id: {
      type: DataTypes.INTEGER,
      allowNull: false, // Disimpan saat user memilih
      references: { model: 'Options', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  }, {
    sequelize,
    modelName: 'UserQuizAnswer',
    // Kita HANYA butuh timestamps 'updatedAt' untuk tahu kapan terakhir diubah
    timestamps: true,
    updatedAt: true,
    createdAt: false, // Tidak perlu createdAt
  });
  return UserQuizAnswer;
};