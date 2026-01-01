    const AuthorizationService = require('../services/authorizationService');
const MQService = require('../services/mqService');
const axios = require('axios');

const registerUser = async (req, res) => {
    try {
        const userData = req.body;
        const recaptchaToken = userData.recaptchaToken;
        if (!recaptchaToken) {
            return res.status(400).json({
                success: false,
                message: 'Missing reCAPTCHA token'
            });
        }

        // Verify reCAPTCHA
        const secret = process.env.RECAPTCHA_SECRET_KEY;
        const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${recaptchaToken}`;
        const recaptchaRes = await axios.post(verifyUrl);

        if (!recaptchaRes.data.success) {
            return res.status(400).json({
                success: false,
                message: 'reCAPTCHA verification failed'
            });
        }

        const newUser = await AuthorizationService.createUser(userData);
        
        // Publish email task to RabbitMQ instead of sending directly
        await MQService.publishToQueue('email_queue', {
            event: 'USER_REGISTERED',
            data: {
                email: newUser.email,
                otp_code: newUser.otp_code,
                user_id: newUser.user_id
            }
        });

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user_id: newUser.user_id,
                email: newUser.email,
                address: newUser.address,
                otp_expiry: newUser.otp_expiry
            }
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const resendOtp = async (req, res) => {
    try {
        const data = req.body;
        console.log(data);
        const email = data.email;
        const newOtpCode = await AuthorizationService.updateOtpCode(email);
        
        // Publish OTP resend task to RabbitMQ
        await MQService.publishToQueue('email_queue', {
            event: 'OTP_RESEND',
            data: {
                email: email,
                otp_code: newOtpCode
            }
        });

        return res.status(200).json({
            success: true,
            message: 'OTP code resent successfully',
            data: {
                email: email,
                otpCode: newOtpCode
            }
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const verifyUser = async (req, res) => {
    try {
        const { email, otpCode } = req.body;
        const user = await AuthorizationService.verifyUser(email, otpCode);

        return res.status(200).json({
            success: true,
            message: 'User verified successfully',
            data: {
                user_id: user.user_id,
                email: user.email,
                address: user.address
            }
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Login user with email and password
 * Returns access token and refresh token
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Call service to login
        const result = await AuthorizationService.login(email, password);

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: result
        });

    } catch (error) {
        // Handle specific errors
        if (error.message === 'Invalid email or password') {
            return res.status(401).json({
                success: false,
                message: error.message
            });
        }

        if (error.message === 'Please verify your email before logging in') {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'An error occurred during login'
        });
    }
};

/**
 * Logout user by invalidating refresh token
 */
const logout = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        await AuthorizationService.logout(userId);

        return res.status(200).json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'An error occurred during logout'
        });
    }
};

/**
 * Refresh access token using refresh token
 */
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        const result = await AuthorizationService.refreshAccessToken(refreshToken);

        return res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            data: result
        });

    } catch (error) {
        if (error.message.includes('Invalid') || error.message.includes('expired')) {
            return res.status(401).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'An error occurred while refreshing token'
        });
    }
};

/**
 * Google OAuth2 Login
 * Accepts Google ID Token from frontend
 * Handles user registration/login via Google
 */
const googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body;

        // Validate input
        if (!idToken) {
            return res.status(400).json({
                success: false,
                message: 'Google ID Token is required'
            });
        }

        // Call service to handle Google login
        const result = await AuthorizationService.googleLogin(idToken);

        return res.status(200).json({
            success: true,
            message: 'Google login successful',
            data: result
        });

    } catch (error) {
        // Handle specific errors
        if (error.message.includes('Invalid Google token')) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired Google token'
            });
        }

        if (error.message.includes('Google token has expired')) {
            return res.status(401).json({
                success: false,
                message: 'Google token has expired, please try again'
            });
        }

        // Log unexpected errors for debugging
        console.error('Google login error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'An error occurred during Google login'
        });
    }
};

module.exports = {
    registerUser,
    verifyUser,
    resendOtp,
    login,
    logout,
    refreshToken,
    googleLogin
};