const sequelize = require('../config/db');
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const Watchlist = require('./WatchList');

// Define associations

// User - Product relationships
User.hasMany(Product, {
  foreignKey: 'seller_id',
  as: 'soldProducts'
});

User.hasMany(Product, {
  foreignKey: 'winner_id',
  as: 'wonProducts'
});

Product.belongsTo(User, {
  foreignKey: 'seller_id',
  as: 'seller'
});

Product.belongsTo(User, {
  foreignKey: 'winner_id',
  as: 'winner'
});

// Category - Product relationship
Category.hasMany(Product, {
  foreignKey: 'category_id',
  as: 'products'
});

Product.belongsTo(Category, {
  foreignKey: 'category_id',
  as: 'category'
});

// Watchlist - User and Product relationships (Many-to-Many)
User.belongsToMany(Product, {
  through: Watchlist,
  foreignKey: 'user_id',
  otherKey: 'product_id',
  as: 'watchedProducts'
});

Product.belongsToMany(User, {
  through: Watchlist,
  foreignKey: 'product_id',
  otherKey: 'user_id',
  as: 'watchers'
});

module.exports = {
  sequelize,
  User,
  Category,
  Product,
  Watchlist
};
