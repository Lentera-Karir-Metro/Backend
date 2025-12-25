'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'password', {
      type: Sequelize.STRING,
      allowNull: true, // Nullable because Google users might not have a password
    });
    await queryInterface.addColumn('Users', 'is_verified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
    await queryInterface.addColumn('Users', 'verification_token', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    
    // Make supabase_auth_id nullable since we are moving away from Supabase as the only auth provider
    await queryInterface.changeColumn('Users', 'supabase_auth_id', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'password');
    await queryInterface.removeColumn('Users', 'is_verified');
    await queryInterface.removeColumn('Users', 'verification_token');
    
    // Revert supabase_auth_id to not null (might fail if there are nulls, but this is for rollback)
    // We'll just leave it nullable in down or try to revert if possible. 
    // For safety in dev, we might skip reverting the null constraint or set it back to false if we are sure.
    // Let's just try to set it back.
    /* 
    await queryInterface.changeColumn('Users', 'supabase_auth_id', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });
    */
  }
};
