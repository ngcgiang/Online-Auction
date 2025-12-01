const express = require('express');
const router = express.Router();
const { verifyAccessToken } = require('../middlewares/authMiddleware');
const { validateRateUser } = require('../middlewares/ratingValidator');
const handleValidationErrors = require('../middlewares/validationHandler');
const { rateUser } = require('../controllers/ratingController');
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

router.patch('/change-email',verifyAccessToken,emailValidator, handleValidationErrors, changeEmail);
router.patch('/change-fullname', verifyAccessToken, changeFullName);
router.patch('/change-password', verifyAccessToken,passwordValidator, handleValidationErrors, changePassword);

module.exports = router;
