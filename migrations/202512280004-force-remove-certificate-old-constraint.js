'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('[Migration] Force removing old certificate constraint: user_learning_path_certificate_unique');
      
      // Try to remove the old constraint
      try {
        await queryInterface.removeConstraint('Certificates', 'user_learning_path_certificate_unique', { transaction });
        console.log('[Migration] ✓ Removed old constraint via removeConstraint');
      } catch (err) {
        console.log('[Migration] removeConstraint failed, trying raw SQL...');
        
        // Fallback: Use raw SQL
        try {
          await queryInterface.sequelize.query(
            'ALTER TABLE `Certificates` DROP INDEX `user_learning_path_certificate_unique`;',
            { transaction }
          );
          console.log('[Migration] ✓ Removed old constraint via raw SQL');
        } catch (err2) {
          console.log('[Migration] Raw SQL also failed, constraint may not exist:', err2.message);
        }
      }
      
      // Ensure the correct user_course_certificate_unique constraint exists
      console.log('[Migration] Ensuring user_course_certificate_unique constraint exists');
      try {
        await queryInterface.addConstraint('Certificates', {
          fields: ['user_id', 'course_id'],
          type: 'unique',
          name: 'user_course_certificate_unique',
          transaction
        });
        console.log('[Migration] ✓ Added user_course_certificate_unique constraint');
      } catch (err) {
        console.log('[Migration] user_course_certificate_unique may already exist:', err.message);
      }
      
      await transaction.commit();
      console.log('[Migration] ✓ Certificate constraint migration completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('[Migration] Certificate constraint migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remove new constraint
      try {
        await queryInterface.removeConstraint('Certificates', 'user_course_certificate_unique', { transaction });
      } catch (err) {
        console.log('[Migration Down] Could not remove user_course_certificate_unique:', err.message);
      }
      
      // Re-add old constraint (if needed for rollback)
      try {
        await queryInterface.addConstraint('Certificates', {
          fields: ['user_id'],
          type: 'unique',
          name: 'user_learning_path_certificate_unique',
          transaction
        });
      } catch (err) {
        console.log('[Migration Down] Could not add old constraint:', err.message);
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
