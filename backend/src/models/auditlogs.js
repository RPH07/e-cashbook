'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AuditLogs extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }
  AuditLogs.init({
    action: { type: DataTypes.STRING, allowNull: false },
    details: DataTypes.TEXT,
    userId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'AuditLogs',
    tableName: 'AuditLogs',
    timestamps: true
  });
  return AuditLogs;
};