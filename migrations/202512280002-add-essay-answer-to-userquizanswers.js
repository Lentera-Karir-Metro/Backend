'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. Add essay_answer column untuk jawaban essai
      await queryInterface.addColumn('UserQuizAnswers', 'essay_answer', {
        type: Sequelize.TEXT,
        allowNull: true,
        after: 'selected_option_id'
      }, { transaction });

      // 2. Make selected_option_id nullable (karena essai tidak punya option)
      await queryInterface.changeColumn('UserQuizAnswers', 'selected_option_id', {
        type: Sequelize.INTEGER,
        allowNull: true, // Changed from false to true
        references: { model: 'Options', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }, { transaction });

      await transaction.commit();
      console.log('[Migration] ✓ Added essay_answer column and made selected_option_id nullable');
    } catch (error) {
      await transaction.rollback();
      console.error('[Migration] Failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remove essay_answer column
      await queryInterface.removeColumn('UserQuizAnswers', 'essay_answer', { transaction });

      // Make selected_option_id NOT NULL again
      await queryInterface.changeColumn('UserQuizAnswers', 'selected_option_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Options', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
