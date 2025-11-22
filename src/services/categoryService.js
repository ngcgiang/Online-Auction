const category = require('../models/Category');


const getAllCategories = async () => {
  try {
    const categories = await category.findAll();
    return categories;
    } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
    }
};

module.exports = {
  getAllCategories,
};