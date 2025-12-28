'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remove essay_answer column from UserQuizAnswers table
      await queryInterface.removeColumn('UserQuizAnswers', 'essay_answer', { transaction });

      // Make selected_option_id NOT NULL again (since we only support multiple choice now)
      await queryInterface.changeColumn('UserQuizAnswers', 'selected_option_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Options', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }, { transaction });

      await transaction.commit();
      console.log('[Migration] ✓ Removed essay_answer column and made selected_option_id NOT NULL');
    } catch (error) {
      await transaction.rollback();
      console.error('[Migration] Failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Add essay_answer column back
      await queryInterface.addColumn('UserQuizAnswers', 'essay_answer', {
        type: Sequelize.TEXT,
        allowNull: true
      }, { transaction });

      // Make selected_option_id nullable again
      await queryInterface.changeColumn('UserQuizAnswers', 'selected_option_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
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
