'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      this.belongsTo(models.Account, { foreignKey: 'accountId', as: 'account' });
      this.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
      this.belongsTo(models.Account, { as: 'toAccount', foreignKey: 'toAccountId' });
    }
  }
  Transaction.init({
    date: { type: DataTypes.DATEONLY, allowNull: false },
    amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    balance_before: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00 },
    balance_after: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00 },
    reference_id: { type: DataTypes.STRING, allowNull: true },
    type: { type: DataTypes.ENUM('income', 'expense', 'transfer'), allowNull: false },
    description: DataTypes.TEXT,
    evidence_link: DataTypes.STRING,
    userId: DataTypes.INTEGER,
    accountId: DataTypes.INTEGER,
    categoryId: DataTypes.INTEGER,
    toAccountId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Transaction',
    tableName: 'Transactions',
    timestamps: true
  });
  return Transaction;
};