'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      this.hasMany(models.Transaction, { foreignKey: 'userId', as: 'transactions' });
      this.hasMany(models.AuditLogs, { foreignKey: 'userId', as: 'audit_logs' });
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
      type: DataTypes.ENUM('admin', 'finance', 'staff', 'auditor'), 
      allowNull: false, 
      defaultValue: 'staff'
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    timestamps: true
  });
  return User;
};