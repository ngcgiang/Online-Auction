const { body, validationResult } = require('express-validator');

/**
 * Validate Google Login Request
 * Checks for required idToken field
 */
const validateGoogleLogin = [
    body('idToken')
        .trim()
        .notEmpty()
        .withMessage('Google ID Token is required')
        .isString()
        .withMessage('ID Token must be a string')
        .isLength({ min: 10 })
        .withMessage('Invalid token format')
];

/**
 * Middleware to handle validation errors from express-validator
 */
const handleGoogleLoginValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    }
    next();
};

module.exports = {
    validateGoogleLogin,
    handleGoogleLoginValidationErrors
};
