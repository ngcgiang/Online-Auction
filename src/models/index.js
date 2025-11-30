const sequelize = require('../config/db');
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const Watchlist = require('./WatchList');
const Bid = require('./Bid');
const ProductImage = require('./ProductImage');
const ProductDescription = require('./ProductDescription');
const QuestionAnswer = require('./QuestionAnswer');
const Rating = require('./Rating');
const RefusedBidder = require('./RefusedBidder');
const Order = require('./Order');

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

// Product - ProductDescription relationship
Product.hasMany(ProductDescription, {
  foreignKey: 'product_id',
  as: 'descriptions'
});

ProductDescription.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// QuestionAnswer - Product relationship
Product.hasMany(QuestionAnswer, {
  foreignKey: 'product_id',
  as: 'questions'
});

QuestionAnswer.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// QuestionAnswer - User relationship
User.hasMany(QuestionAnswer, {
  foreignKey: 'user_id',
  as: 'comments'
});

QuestionAnswer.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// QuestionAnswer - Self-referencing (parent-child for questions and answers)
QuestionAnswer.belongsTo(QuestionAnswer, {
  foreignKey: 'parent_comment_id',
  as: 'parentComment'
});

QuestionAnswer.hasMany(QuestionAnswer, {
  foreignKey: 'parent_comment_id',
  as: 'replies'
});

// Rating - User relationships
User.hasMany(Rating, {
  foreignKey: 'user_id',
  as: 'ratingsReceived'
});

User.hasMany(Rating, {
  foreignKey: 'reviewer_id',
  as: 'ratingsGiven'
});

Rating.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

Rating.belongsTo(User, {
  foreignKey: 'reviewer_id',
  as: 'reviewer'
});

// Rating - Product relationship
Product.hasMany(Rating, {
  foreignKey: 'product_id',
  as: 'ratings'
});

Rating.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// RefusedBidder - Product relationship
Product.hasMany(RefusedBidder, {
  foreignKey: 'product_id',
  as: 'refusedBidders'
});

RefusedBidder.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// RefusedBidder - User relationship
User.hasMany(RefusedBidder, {
  foreignKey: 'bidder_id',
  as: 'refusals'
});

RefusedBidder.belongsTo(User, {
  foreignKey: 'bidder_id',
  as: 'bidder'
});

// Order - Product relationship
Product.hasMany(Order, {
  foreignKey: 'product_id',
  as: 'orders'
});

Order.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// Order - User relationships (Winner and Seller)
User.hasMany(Order, {
  foreignKey: 'winner_id',
  as: 'ordersAsWinner'
});

User.hasMany(Order, {
  foreignKey: 'seller_id',
  as: 'ordersAsSeller'
});

Order.belongsTo(User, {
  foreignKey: 'winner_id',
  as: 'winner'
});

Order.belongsTo(User, {
  foreignKey: 'seller_id',
  as: 'seller'
});

module.exports = {
  sequelize,
  User,
  Category,
  Product,
  Watchlist,
  Bid,
  ProductImage,
  ProductDescription,
  QuestionAnswer,
  Rating,
  RefusedBidder,
  Order
};
