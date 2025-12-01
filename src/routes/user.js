const express = require('express');
const router = express.Router();
const { verifyAccessToken } = require('../middlewares/authMiddleware');
const { validateRateUser, validateUpdateRating } = require('../middlewares/ratingValidator');
const handleValidationErrors = require('../middlewares/validationHandler');
const { rateUser, updateUserRating } = require('../controllers/ratingController');
const { changeEmail, changeFullName, changePassword } = require('../controllers/userController');
const { emailValidator, passwordValidator } = require('../middlewares/userValidator');

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

router.patch('/change-email',verifyAccessToken,emailValidator, handleValidationErrors, changeEmail);
router.patch('/change-fullname', verifyAccessToken, changeFullName);
router.patch('/change-password', verifyAccessToken,passwordValidator, handleValidationErrors, changePassword);

module.exports = router;
