'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CertificateTemplate extends Model {
    static associate(models) {
      // Define associations here if needed
    }
  }
  CertificateTemplate.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    file_url: {
      type: DataTypes.STRING,
      allowNull: false
    },
    preview_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'CertificateTemplate',
  });
  return CertificateTemplate;
};
