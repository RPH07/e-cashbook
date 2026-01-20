'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Account extends Model {
    static associate(models) {
      // define association here
    }
  }
  Account.init({
    account_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    account_type: {
      type: DataTypes.ENUM('tabungan', 'giro'),
      allowNull: false
    },
    balance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00
    }
  }, {
    sequelize,
    modelName: 'Account',
    tableName: 'Accounts',
    timestamps: true
  });
  return Account;
};