'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Backfill course_title and instructor_name from Courses when course_id present
    await queryInterface.sequelize.query(`
      UPDATE Certificates AS cer
      JOIN Courses AS c ON cer.course_id = c.id
      SET
        cer.course_title = IFNULL(cer.course_title, c.title),
        cer.instructor_name = IFNULL(cer.instructor_name, c.mentor_name)
      WHERE cer.course_id IS NOT NULL;
    `);

    // Make columns NOT NULL after backfill
    try {
      await queryInterface.changeColumn('Certificates', 'course_title', {
        type: Sequelize.STRING,
        allowNull: false
      });
    } catch (err) {
      // ignore if change fails
    }

    try {
      await queryInterface.changeColumn('Certificates', 'instructor_name', {
        type: Sequelize.STRING,
        allowNull: false
      });
    } catch (err) {
      // ignore if change fails
    }
  },

  async down(queryInterface, Sequelize) {
    // Revert columns to nullable
    try {
      await queryInterface.changeColumn('Certificates', 'course_title', {
        type: Sequelize.STRING,
        allowNull: true
      });
    } catch (err) {
      // ignore
    }

    try {
      await queryInterface.changeColumn('Certificates', 'instructor_name', {
        type: Sequelize.STRING,
        allowNull: true
      });
    } catch (err) {
      // ignore
    }
  }
};
