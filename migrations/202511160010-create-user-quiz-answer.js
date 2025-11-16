// File: migrations/202511160010-create-user-quiz-answer.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserQuizAnswers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_quiz_attempt_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'UserQuizAttempts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      question_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Questions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      selected_option_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Options', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      // Tidak perlu createdAt, hanya updatedAt
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Constraint: User hanya bisa menjawab 1x per pertanyaan per sesi
    await queryInterface.addConstraint('UserQuizAnswers', {
      fields: ['user_quiz_attempt_id', 'question_id'],
      type: 'unique',
      name: 'user_attempt_question_unique_constraint'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UserQuizAnswers');
  }
};