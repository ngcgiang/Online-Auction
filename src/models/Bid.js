const sequelize = require('../config/db');
const { DataTypes, Model } = require('sequelize');

const Bid = sequelize.define('Bid',{
    bid_id:{
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    product_id:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Products',
            key: 'product_id'
        }
    },
    bidder_id:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references:{
            model: 'Users',
            key: 'user_id'
        }
    },
    amount:{
        type: DataTypes.DECIMAL(15,2),
        allowNull: false
    },
    bid_time:{
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    status: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1 // 1: active, 0: withdrawn
    }

},{
    tableName: 'Bids',
    timestamps: false
})

module.exports = Bid;