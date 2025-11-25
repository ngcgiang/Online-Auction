const {
    registerUser
} = require('../controllers/userController');
const {validateResgisterUser} = require('../middlewares/userValidator');
const handleValidationErrors = require('../middlewares/validationHandler');


const express = require('express');
const router = express.Router();

router.post('/register', validateResgisterUser,handleValidationErrors,registerUser);

module.exports = router;