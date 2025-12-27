'use strict';

/**
 * Migration to fix Questions table ID from VARCHAR to INT AUTO_INCREMENT
 * This requires dropping all related data and constraints
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Step 1: Drop all tables that depend on Questions/Options
    await queryInterface.dropTable('UserQuizAnswers');
    await queryInterface.dropTable('Options');
    await queryInterface.dropTable('Questions');

    // Step 2: Recreate Questions with INT AUTO_INCREMENT
    await queryInterface.createTable('Questions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      quiz_id: {
        type: Sequelize.STRING(16),
        allowNull: false,
        references: {
          model: 'Quizzes',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      question_text: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      question_type: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'multiple_choice'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Step 3: Recreate Options with question_id as INT
    await queryInterface.createTable('Options', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      question_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Questions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      option_text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      is_correct: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Step 4: Recreate UserQuizAnswers
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
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Step 5: Add unique constraint
    await queryInterface.addConstraint('UserQuizAnswers', {
      fields: ['user_quiz_attempt_id', 'question_id'],
      type: 'unique',
      name: 'user_attempt_question_unique_constraint'
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop and recreate with old structure (not recommended)
    await queryInterface.dropTable('UserQuizAnswers');
    await queryInterface.dropTable('Options');
    await queryInterface.dropTable('Questions');
  }
};
