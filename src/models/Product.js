const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Product = sequelize.define('Product', {
  product_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  product_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Categories',
      key: 'category_id'
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
  winner_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    references: {
      model: 'Users',
      key: 'user_id'
    }
  },
  start_value: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  current_price: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  buy_now_value: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: null
  },
  price_step: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'sold', 'expired'),
    defaultValue: 'active'
  },
  permission: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  auto_renewal: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'Products',
  timestamps: false,
  indexes: [
    {
      type: 'FULLTEXT',
      fields: ['product_name']
    }
  ]
});

module.exports = Product;
