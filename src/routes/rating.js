const express = require('express');
const router = express.Router();
const { verifyAccessToken } = require('../middlewares/authMiddleware');
const { validateRateWinner } = require('../middlewares/ratingValidator');
const handleValidationErrors = require('../middlewares/validationHandler');
const { rateWinner } = require('../controllers/ratingController');

// Rate the winner of an auction
router.post(
  '/rating',
  verifyAccessToken,
  validateRateWinner,
  handleValidationErrors,
  rateWinner
);

module.exports = router;
