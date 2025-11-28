const {
    registerUser, verifyUser, resendOtp
} = require('../controllers/authorizationController');
const {validateResgisterUser} = require('../middlewares/userValidator');
const handleValidationErrors = require('../middlewares/validationHandler');


const express = require('express');
const router = express.Router();

router.post('/register', validateResgisterUser,handleValidationErrors,registerUser);
router.post('/verify', verifyUser);
router.patch('/resend-otp', resendOtp);

module.exports = router;