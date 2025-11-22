const express = require('express');
const router = express.Router();

const { 
    fetchTopValueProducts, 
    fetchTopLeastTimeLeftProducts, 
    fetchTopMostBiddedProducts,
    fetchProductById
 } = require('../controllers/productController');

// Route để lấy sản phẩm có giá trị cao nhất
router.get('/products/top-value', fetchTopValueProducts);
router.get('/products/top-least-time-left', fetchTopLeastTimeLeftProducts);
router.get('/products/top-most-bidded', fetchTopMostBiddedProducts);
router.get('/products/:product_id', fetchProductById);

module.exports = router;    