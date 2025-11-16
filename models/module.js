// File: models/module.js
'use strict';
const { Model } = require('sequelize');
const { generateCustomId } = require('../src/utils/idGenerator');

module.exports = (sequelize, DataTypes) => {
  class Module extends Model {
    static associate(models) {
     Module.belongsTo(models.Course, {
        foreignKey: 'course_id',
        as: 'course',
      });

      // Module bisa terhubung ke satu Quiz (jika module_type = 'quiz')
      Module.belongsTo(models.Quiz, {
        foreignKey: 'quiz_id',
        as: 'quiz',
      });
    }
  }
  Module.init({
    id: {
      type: DataTypes.STRING(16), // MD-XXXXXX
      allowNull: false,
      primaryKey: true,
      unique: true,
    },
    course_id: {
      type: DataTypes.STRING(16),
      allowNull: false,
      references: {
        model: 'Courses', // Nama tabel
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    module_type: {
      type: DataTypes.ENUM('video', 'ebook', 'quiz'),
      allowNull: false,
    },
    sequence_order: {
      type: DataTypes.INTEGER, // Untuk penguncian antar modul
      allowNull: false,
      defaultValue: 0,
    },
    video_url: {
      type: DataTypes.STRING,
      allowNull: true, // Hanya diisi jika module_type = 'video'
    },
    ebook_url: {
      type: DataTypes.STRING,
      allowNull: true, // Hanya diisi jika module_type = 'ebook'
    },
    quiz_id: {
      type: DataTypes.STRING(16), // Nanti jadi FK ke Quiz
      allowNull: true,
    },
    durasi_video_menit: {
      type: DataTypes.INTEGER, // Diisi admin
      allowNull: true,
    },
    estimasi_waktu_menit: {
      type: DataTypes.INTEGER, // Diisi admin
      allowNull: false,
      defaultValue: 0,
    },
  }, {
    sequelize,
    modelName: 'Module',
    timestamps: true,
    hooks: {
      beforeCreate: (module, options) => {
        module.id = generateCustomId('MD'); // Prefix 'MD'
      },
    },
  });
  return Module;
};