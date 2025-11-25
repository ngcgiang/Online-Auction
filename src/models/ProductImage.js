const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProductImage = sequelize.define('ProductImage', {
  image_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Products',
      key: 'product_id'
    }
  },
  img_url: {
    type: DataTypes.STRING(255),
    allowNull: false
  }
}, {
  tableName: 'ProductImages',
  timestamps: false
});

module.exports = ProductImage;
