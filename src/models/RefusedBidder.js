const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const RefusedBidder = sequelize.define('RefusedBidder', {
  refused_id: {
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
  bidder_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'user_id'
    }
  },
  refused_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'RefusedBidders',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['product_id', 'bidder_id']
    }
  ]
});

module.exports = RefusedBidder;
