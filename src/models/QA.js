const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const QA = sequelize.define('QA', {
  comment_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  parent_comment_id: {
    type: DataTypes.INTEGER,
    defaultValue: null,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
},{
  tableName: 'QuestionAnswers',
  timestamps: false
}
);

module.exports = QA;


