// File: models/userquizattempt.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserQuizAttempt extends Model {
    static associate(models) {
      UserQuizAttempt.belongsTo(models.User, { foreignKey: 'user_id' });
      UserQuizAttempt.belongsTo(models.Quiz, { foreignKey: 'quiz_id' });

      // Satu sesi attempt memiliki banyak jawaban parsial
      UserQuizAttempt.hasMany(models.UserQuizAnswer, {
        foreignKey: 'user_quiz_attempt_id',
        as: 'answers',
      });
    }
  }
  UserQuizAttempt.init({
    id: { // Pakai ID standar (INT AUTO_INCREMENT)
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    user_id: {
      type: DataTypes.STRING(16),
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    quiz_id: {
      type: DataTypes.STRING(16),
      allowNull: false,
      references: { model: 'Quizzes', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    status: {
      type: DataTypes.ENUM('in_progress', 'completed'),
      allowNull: false,
      defaultValue: 'in_progress',
    },
    score: {
      type: DataTypes.FLOAT,
      allowNull: true, // Diisi saat status 'completed'
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true, // Diisi saat 'submit'
    },
  }, {
    sequelize,
    modelName: 'UserQuizAttempt',
    timestamps: true, // Otomatis createdAt dan updatedAt
  });
  return UserQuizAttempt;
};