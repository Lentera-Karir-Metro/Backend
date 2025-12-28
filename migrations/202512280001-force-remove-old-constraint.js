'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Force remove constraint lama yang masih ada
      console.log('[Migration] Removing old constraint: user_learning_path_unique_constraint');
      
      // Coba hapus constraint dengan beberapa cara
      try {
        await queryInterface.removeConstraint('UserEnrollments', 'user_learning_path_unique_constraint', { transaction });
        console.log('[Migration] ✓ Removed constraint via removeConstraint');
      } catch (err) {
        console.log('[Migration] removeConstraint failed, trying raw SQL...');
        
        // Fallback: Gunakan raw SQL
        try {
          await queryInterface.sequelize.query(
            'ALTER TABLE `UserEnrollments` DROP INDEX `user_learning_path_unique_constraint`;',
            { transaction }
          );
          console.log('[Migration] ✓ Removed constraint via raw SQL');
        } catch (err2) {
          console.log('[Migration] Raw SQL also failed, constraint may not exist:', err2.message);
        }
      }
      
      // Pastikan constraint user_course_unique yang benar ada
      console.log('[Migration] Ensuring user_course_unique constraint exists');
      try {
        await queryInterface.addConstraint('UserEnrollments', {
          fields: ['user_id', 'course_id'],
          type: 'unique',
          name: 'user_course_unique',
          transaction
        });
        console.log('[Migration] ✓ Added user_course_unique constraint');
      } catch (err) {
        console.log('[Migration] user_course_unique may already exist:', err.message);
      }
      
      await transaction.commit();
      console.log('[Migration] ✓ Migration completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('[Migration] Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remove the new constraint
      await queryInterface.removeConstraint('UserEnrollments', 'user_course_unique', { transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
