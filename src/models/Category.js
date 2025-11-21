const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Category = sequelize.define('Category', {
  category_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  category_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    references: {
      model: 'Categories',
      key: 'category_id'
    },
    onDelete: 'SET NULL'
  }
}, {
  tableName: 'Categories',
  timestamps: false
});

// Self-referencing association for parent-child categories
Category.belongsTo(Category, {
  foreignKey: 'parent_id',
  as: 'parent'
});

Category.hasMany(Category, {
  foreignKey: 'parent_id',
  as: 'children'
});

module.exports = Category;
