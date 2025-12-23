const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Order = sequelize.define('Order', {
  order_id: {
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
  winner_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'user_id'
    }
  },
  seller_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'user_id'
    }
  },
  total_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  payment_method: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  shipping_address: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  delivery_status: {
    type: DataTypes.ENUM('pending', 'shipped', 'delivered', 'cancelled'),
    defaultValue: 'pending'
  },
  order_status: {
    type: DataTypes.ENUM('unpaid', 'paid', 'cancelled'),
    defaultValue: 'unpaid'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Orders',
  timestamps: false
});

module.exports = Order;
