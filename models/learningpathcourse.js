'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class LearningPathCourse extends Model {
    static associate(models) {
      // associations defined in other models via belongsToMany
    }
  }
  LearningPathCourse.init({
    id: { type: DataTypes.STRING(24), primaryKey: true, allowNull: false },
    learning_path_id: { type: DataTypes.STRING(16), allowNull: false },
    course_id: { type: DataTypes.STRING(16), allowNull: false },
    sequence_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  }, {
    sequelize,
    modelName: 'LearningPathCourse',
    tableName: 'LearningPathCourses',
    timestamps: true,
  });

  return LearningPathCourse;
};
