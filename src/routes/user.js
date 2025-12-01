const express = require('express');
const router = express.Router();
const { verifyAccessToken } = require('../middlewares/authMiddleware');
const { validateRateUser, validateUpdateRating } = require('../middlewares/ratingValidator');
const handleValidationErrors = require('../middlewares/validationHandler');
const { rateUser, updateUserRating } = require('../controllers/ratingController');

// Rate the winner of an auction
router.post(
  '/rating',
  verifyAccessToken,
  validateRateUser,
  handleValidationErrors,
  rateUser
);

// Update user rating
router.put(
  '/rating/:rating_id',
  verifyAccessToken,
  validateUpdateRating,
  handleValidationErrors,
  updateUserRating
);

module.exports = router;
