'use strict';

const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    static associate(models) {
      this.hasMany(models.Transaction, { foreignKey: 'categoryId', as: 'transactions' });
    }
  }
  Category.init({
    name: {
      type: DataTypes.STRING, 
      allowNull: false, 
      unique: true
    },
    type: {
      type: DataTypes.ENUM('income', 'expense'), 
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Category',
    tableName: 'Categories',
    timestamps: true
  });
  return Category;
};