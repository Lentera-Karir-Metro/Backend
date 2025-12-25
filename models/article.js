// File: models/article.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Article extends Model {
    static associate(models) {
      // Tidak ada relasi khusus untuk saat ini
    }
  }
  Article.init({
    title: DataTypes.STRING,
    content: DataTypes.TEXT,
    thumbnail_url: DataTypes.STRING,
    author: DataTypes.STRING,
    category: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Article',
  });
  return Article;
};