'use strict';

/**
 * Migration: Add certificate_template_id to Courses table
 * Allows each course to have a default certificate template for auto-generation
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Courses', 'certificate_template_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'CertificateTemplates',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Courses', 'certificate_template_id');
  }
};
