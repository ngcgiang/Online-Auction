const {body} = require('express-validator');

const validateResgisterUser = [
    body('username')
        .isString()
        .trim().notEmpty().withMessage('Username is required')
        .isLength({ max: 50 })
        .withMessage('Username must be less than 50 characters'),
    body('full_name')
        .isString()
        .trim()
        .notEmpty().withMessage('Full name is required')
        .isLength({ max: 100 })
        .withMessage('Full name must be less than 100 characters'),
    body('email')
        .isEmail()
        .withMessage('Invalid email format')
        .isLength({ max: 100 })
        .withMessage('Email must be less than 100 characters'),
    body('password')
        .isLength({ min: 8, max:255 })
        .withMessage('Password must be between 8 and 255 characters'),
    body('address')
        .isString()
        .trim()
        .notEmpty().withMessage('Address is required')
        .isLength({ max: 255 })
        .withMessage('Address must be less than 255 characters')
];

module.exports = {
    validateResgisterUser
};