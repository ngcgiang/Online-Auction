const {body} = require('express-validator');

const validateComment = [
    
    body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isString()
    .withMessage('Content must be a string')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Content must be at least 1 character'),

    body('product_id')
    .notEmpty()
    .withMessage('Product ID is required')
    .isInt()
    .withMessage('Product ID must be a positive integer')
    .toInt(),

    body('parent_comment_id')
    .optional()
    .isInt()
    .withMessage('Parent ID must be a positive integer')
    .toInt(),
];


module.exports = validateComment;