const sequelize = require('../config/db');
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const Watchlist = require('./WatchList');
const Bid = require('./Bid');
const ProductImage = require('./ProductImage');

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

// Direct associations for Watchlist (needed for eager loading)
Watchlist.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

Watchlist.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

Product.hasMany(Watchlist, {
  foreignKey: 'product_id',
  as: 'watchlistEntries'
});

User.hasMany(Watchlist, {
  foreignKey: 'user_id',
  as: 'watchlistEntries'
});

Product.hasMany(Bid,{
  foreignKey: 'product_id',
  as: 'bids'
});

Bid.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

Bid.belongsTo(User, {
  foreignKey: 'bidder_id',
  as: 'bidder'
});

User.hasMany(Bid, {
  foreignKey: 'bidder_id',
  as: 'bids'
});

// Product - ProductImage relationship
Product.hasMany(ProductImage, {
  foreignKey: 'product_id',
  as: 'images'
});

ProductImage.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

module.exports = {
  sequelize,
  User,
  Category,
  Product,
  Watchlist,
  Bid,
  ProductImage
};
