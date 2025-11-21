const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Watchlist = sequelize.define('Watchlist', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'user_id'
    }
  },
  product_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    references: {
      model: 'Products',
      key: 'product_id'
    }
  }
}, {
  tableName: 'Watchlists',
  timestamps: false
});

module.exports = Watchlist;
