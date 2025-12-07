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
const Message = require('./Message');

// -------------------------
// User - Product
// -------------------------
User.hasMany(Product, {
  foreignKey: 'seller_id',
  as: 'soldProducts',
  onDelete: 'CASCADE'
});

User.hasMany(Product, {
  foreignKey: 'winner_id',
  as: 'wonProducts',
  onDelete: 'SET NULL'
});

Product.belongsTo(User, {
  foreignKey: 'seller_id',
  as: 'seller'
});

Product.belongsTo(User, {
  foreignKey: 'winner_id',
  as: 'winner'
});

// -------------------------
// Category - Product
// -------------------------
Category.hasMany(Product, {
  foreignKey: 'category_id',
  as: 'products',
  onDelete: 'SET NULL'
});

Product.belongsTo(Category, {
  foreignKey: 'category_id',
  as: 'category'
});

// -------------------------
// Watchlist (Many-to-Many)
// -------------------------
User.belongsToMany(Product, {
  through: Watchlist,
  foreignKey: 'user_id',
  otherKey: 'product_id',
  as: 'watchedProducts',
  onDelete: 'CASCADE'
});

Product.belongsToMany(User, {
  through: Watchlist,
  foreignKey: 'product_id',
  otherKey: 'user_id',
  as: 'watchers',
  onDelete: 'CASCADE'
});

// Direct relations for eager loading
Watchlist.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
  onDelete: 'CASCADE'
});

Watchlist.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
  onDelete: 'CASCADE'
});

Product.hasMany(Watchlist, {
  foreignKey: 'product_id',
  as: 'watchlistEntries',
  onDelete: 'CASCADE'
});

User.hasMany(Watchlist, {
  foreignKey: 'user_id',
  as: 'watchlistEntries',
  onDelete: 'CASCADE'
});

// -------------------------
// Bid
// -------------------------
Product.hasMany(Bid, {
  foreignKey: 'product_id',
  as: 'bids',
  onDelete: 'CASCADE'
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
  as: 'bids',
  onDelete: 'CASCADE'
});

// -------------------------
// Product Images
// -------------------------
Product.hasMany(ProductImage, {
  foreignKey: 'product_id',
  as: 'images',
  onDelete: 'CASCADE'
});

ProductImage.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// -------------------------
// Product Descriptions
// -------------------------
Product.hasMany(ProductDescription, {
  foreignKey: 'product_id',
  as: 'descriptions',
  onDelete: 'CASCADE'
});

ProductDescription.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// -------------------------
// Rating
// -------------------------
User.hasMany(Rating, {
  foreignKey: 'user_id',
  as: 'ratingsReceived',
  onDelete: 'CASCADE'
});

User.hasMany(Rating, {
  foreignKey: 'reviewer_id',
  as: 'ratingsGiven',
  onDelete: 'CASCADE'
});

Rating.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

Rating.belongsTo(User, {
  foreignKey: 'reviewer_id',
  as: 'reviewer'
});

Product.hasMany(Rating, {
  foreignKey: 'product_id',
  as: 'ratings',
  onDelete: 'CASCADE'
});

Rating.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// -------------------------
// Refused Bidder
// -------------------------
Product.hasMany(RefusedBidder, {
  foreignKey: 'product_id',
  as: 'refusedBidders',
  onDelete: 'CASCADE'
});

RefusedBidder.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

User.hasMany(RefusedBidder, {
  foreignKey: 'bidder_id',
  as: 'refusals',
  onDelete: 'CASCADE'
});

RefusedBidder.belongsTo(User, {
  foreignKey: 'bidder_id',
  as: 'bidder'
});

// -------------------------
// Order
// -------------------------
Product.hasMany(Order, {
  foreignKey: 'product_id',
  as: 'orders',
  onDelete: 'CASCADE'
});

Order.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

User.hasMany(Order, {
  foreignKey: 'winner_id',
  as: 'ordersAsWinner',
  onDelete: 'SET NULL'
});

User.hasMany(Order, {
  foreignKey: 'seller_id',
  as: 'ordersAsSeller',
  onDelete: 'SET NULL'
});

Order.belongsTo(User, {
  foreignKey: 'winner_id',
  as: 'winner'
});

Order.belongsTo(User, {
  foreignKey: 'seller_id',
  as: 'seller'
});

// -------------------------
// Question Answer
// -------------------------
Product.hasMany(QuestionAnswer, {
  foreignKey: 'product_id',
  as: 'questions',
  onDelete: 'CASCADE'
});

QuestionAnswer.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

User.hasMany(QuestionAnswer, {
  foreignKey: 'user_id',
  as: 'comments',
  onDelete: 'CASCADE'
});

QuestionAnswer.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Self-referencing QA
QuestionAnswer.belongsTo(QuestionAnswer, {
  foreignKey: 'parent_comment_id',
  as: 'parentComment',
  onDelete: 'CASCADE'
});

QuestionAnswer.hasMany(QuestionAnswer, {
  foreignKey: 'parent_comment_id',
  as: 'replies',
  onDelete: 'CASCADE'
});

// -------------------------
// Message
// -------------------------
Product.hasMany(Message, {
  foreignKey: 'product_id',
  as: 'messages',
  onDelete: 'CASCADE'
});

Message.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

User.hasMany(Message, {
  foreignKey: 'sender_id',
  as: 'sentMessages',
  onDelete: 'CASCADE'
});

Message.belongsTo(User, {
  foreignKey: 'sender_id',
  as: 'sender'
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
  Rating,
  RefusedBidder,
  Order,
  QuestionAnswer,
  Message,
};
