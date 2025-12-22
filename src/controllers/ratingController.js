const sellerService = require('../services/sellerService');
const { validationResult } = require('express-validator');
const { getAllRatings } = require('../services/userService');

/**
 * Rate the winner of an auction
 * POST /api/users/rating
 */
const rateUser = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }

    const reviewerId = req.user?.user_id;

    if (!reviewerId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { userId, productId, ratingPoint, content } = req.body;

    // Call service to create rating
    const result = await sellerService.rateUser({
      reviewerId,
      userId,
      productId,
      ratingPoint,
      content
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);

  } catch (error) {
    console.error('Error rating winner:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while submitting the rating',
      error: error.message
    });
  }
};

/**
 * Update an existing rating
 * PUT /api/users/rating/:rating_id
 */
const updateUserRating = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }

    const reviewerId = req.user?.user_id;

    if (!reviewerId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { rating_id } = req.params;
    const { ratingPoint, content } = req.body;

    // Call service to update rating
    const result = await sellerService.updateRating({
      ratingId: parseInt(rating_id),
      reviewerId,
      ratingPoint,
      content
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('Error updating rating:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating the rating',
      error: error.message
    });
  }
};

module.exports = {
  rateUser,
  updateUserRating
};
