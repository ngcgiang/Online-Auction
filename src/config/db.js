// config/database.js
const { Sequelize } = require('sequelize');

// Tạo instance Sequelize
const sequelize = new Sequelize(
  'auction_db',   // tên database
  'root',       // user
  '051104',       // mật khẩu
  {
    host: '127.0.0.1',
    port: 3306,
    dialect: 'mysql',    // bạn có thể đổi thành 'postgres', 'sqlite', 'mssql'
    logging: false,      // set true nếu muốn log câu SQL
    pool: {
      max: 5,            // số connection tối đa
      min: 0,            // số connection tối thiểu
      acquire: 30000,    // tối đa 30s để lấy connection
      idle: 10000        // idle 10s thì release connection
    }
  }
);

module.exports = sequelize;