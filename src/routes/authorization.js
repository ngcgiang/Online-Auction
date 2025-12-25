const {
    registerUser, verifyUser, resendOtp, login, logout, refreshToken, googleLogin
} = require('../controllers/authorizationController');
const {validateResgisterUser} = require('../middlewares/userValidator');
const handleValidationErrors = require('../middlewares/validationHandler');
const { validateGoogleLogin, handleGoogleLoginValidationErrors } = require('../middlewares/googleLoginValidator');


const express = require('express');
const router = express.Router();

router.post('/register', validateResgisterUser,handleValidationErrors,registerUser);
router.post('/verify', verifyUser);
router.patch('/resend-otp', resendOtp);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.post('/google-login', validateGoogleLogin, handleGoogleLoginValidationErrors, googleLogin);

module.exports = router;