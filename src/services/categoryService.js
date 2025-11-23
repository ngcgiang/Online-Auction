const category = require('../models/Category');

class CategoryService {
  /**
   * Fetch all categories from the database
   * @returns {Array} - List of categories
   * */
   async getAllCategories() {
    try{
        const categories = await category.findAll();
        return categories;
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
   }}
module.exports = new CategoryService();