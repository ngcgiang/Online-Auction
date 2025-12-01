const {
    getQAbyProduct,
     addComment
} = require('../controllers/qaController');
const { verifyAccessToken} = require('../middlewares/authMiddleware');

const express = require('express');
const router = express.Router();

router.get('/:product_id', getQAbyProduct);
router.post('/',
    verifyAccessToken,
    addComment);

module.exports = router;
