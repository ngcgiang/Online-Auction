    const AuthorizationService = require('../services/authorizationService');
    const EmailService = require('../services/emailService');

    const registerUser = async (req, res) => {
        try {
            const userData = req.body;
            const newUser = await AuthorizationService.createUser(userData);         // Generate a 6-digit OTP code
            EmailService.sendEmail(newUser.email,newUser.otp_code);
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
            const data  = req.body;
            console.log(data);
            const email = data.email;
            const newOtpCode = await AuthorizationService.updateOtpCode(email);
            EmailService.sendEmail(email,newOtpCode);
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

    module.exports = {
        registerUser,
        verifyUser,
        resendOtp,
        login,
        logout,
        refreshToken
    };