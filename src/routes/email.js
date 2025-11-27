const sendEmail  = require('../controllers/emailController');
const express = require('express');
const router = express.Router();

router.post('/send-verification-email', sendEmail.sendVerificationEmail);
module.exports = router;