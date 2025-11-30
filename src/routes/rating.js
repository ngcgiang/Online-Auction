const express = require('express');
const router = express.Router();
const { verifyAccessToken } = require('../middlewares/authMiddleware');
const { validateRateUser } = require('../middlewares/ratingValidator');
const handleValidationErrors = require('../middlewares/validationHandler');
const { rateUser } = require('../controllers/ratingController');

// Rate the winner of an auction
router.post(
  '/rating',
  verifyAccessToken,
  validateRateUser,
  handleValidationErrors,
  rateUser
);

module.exports = router;
