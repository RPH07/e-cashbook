'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // define association here
    }
  }
  User.init({
    name: {
      type: DataTypes.STRING, 
      allowNull: false
    },
    email: {
      type: DataTypes.STRING, 
      allowNull: false, 
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING, 
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'bendahara', 'viewer', 'auditor'), 
      allowNull: false, 
      defaultValue: 'viewer'
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    timestamps: true
  });
  return User;
};