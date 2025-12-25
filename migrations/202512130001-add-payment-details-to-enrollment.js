'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('UserEnrollments', 'amount_paid', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    });
    
    await queryInterface.addColumn('UserEnrollments', 'payment_method', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('UserEnrollments', 'amount_paid');
    await queryInterface.removeColumn('UserEnrollments', 'payment_method');
  }
};
