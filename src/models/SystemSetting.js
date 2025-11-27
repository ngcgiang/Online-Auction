const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); 

const SystemSetting = sequelize.define('SystemSetting', {
  // Mapping cột id
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // Mapping cột setting_key
  setting_key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'setting_key' // Tên cột thật trong DB
  },
  // Mapping cột setting_value
  setting_value: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'setting_value'
  },
  // Mapping cột description
  description: {
    type: DataTypes.STRING
  },
  // Mapping cột data_type
  data_type: {
    type: DataTypes.STRING,
    defaultValue: 'string',
    field: 'data_type'
  }
}, {
  tableName: 'system_settings', // Tên bảng trong MySQL
  timestamps: true,             // Tự động quản lý created_at, updated_at
  underscored: true             // Chuyển đổi camelCase (JS) sang snake_case (DB)
});

module.exports = SystemSetting;