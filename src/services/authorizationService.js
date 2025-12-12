const { User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// JWT Configuration
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret-key-change-in-production';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days


class AuthorizationService {
    async checkEmailExists(email){
        const user = await User.findOne({ where: { email } });
        return !!user;
    }

    async createUser(userData){
        const hasedPassword = await bcrypt.hash(userData.password, 10);
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otp_expiry = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes
        if(!await this.checkEmailExists(userData.email)){
            const newUser = await User.create({
                email: userData.email,
                full_name: userData.full_name,
                password: hasedPassword,
                address: userData.address,
                otp_code: otpCode,
                otp_expiry: otp_expiry
                //role: 'bidder'    
            });
            newUser.is_verified = false;
            return newUser;
        } else{
            throw new Error('Email already in use');
        }
    }

    async verifyUser(email, otpCode) {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            throw new Error('User not found');
        }

        if (user.otp_code !== otpCode) {
            throw new Error('Invalid OTP code');
        }

        if (new Date() > user.otp_expiry) {
            throw new Error('OTP code has expired');
        }

        user.is_verified = true;
        await user.save();

        return user;
    }

    async verifyOtpcode(otp_code, email){
        const user = await User.findOne({ where: { email } });
        if (!user) return false;
        if (user.otp_code !== otp_code) return false;
        if (new Date() > user.otp_expiry) return false;
        return true;
    }


    async updateOtpCode(email) {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            throw new Error('User not found');
        }
        const newOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otp_expiry = new Date(Date.now() + 10 * 60 * 1000);
        user.otp_code = newOtpCode;
        user.otp_expiry = otp_expiry;
        await user.save();
        return newOtpCode;
    }

    async saveOtp(otp_code, email){
        const user = await User.findOne({ where: { email } });
        if (!user) {
            throw new Error('User not found');
        }
        user.otp_code = otp_code;
        user.otp_expiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();
    }

    /**
     * Login user with email and password
     * Returns access token and refresh token
     * @param {string} email - User's email
     * @param {string} password - User's plain text password
     * @returns {Promise<Object>} - User info and tokens
     */
    async login(email, password) {
        try {
            // Step 1: Find user by email
            const user = await User.findOne({ where: { email } });
            
            if (!user) {
                throw new Error('Invalid email or password');
            }

            // Step 2: Check if user is verified
            if (!user.is_verified) {
                throw new Error('Please verify your email before logging in');
            }

            // Step 3: Compare password with bcrypt
            const isPasswordValid = await bcrypt.compare(password, user.password);
            
            if (!isPasswordValid) {
                throw new Error('Invalid email or password');
            }

            // Step 4: Generate Access Token (short-lived)
            const accessTokenPayload = {
                user_id: user.user_id,
                email: user.email,
                role: user.role
            };
            
            const accessToken = jwt.sign(
                accessTokenPayload,
                ACCESS_TOKEN_SECRET,
                { expiresIn: ACCESS_TOKEN_EXPIRY }
            );

            // Step 5: Generate Refresh Token (long-lived)
            const refreshTokenPayload = {
                user_id: user.user_id,
                email: user.email,
                // Add random string for extra security
                jti: crypto.randomBytes(16).toString('hex')
            };
            
            const refreshToken = jwt.sign(
                refreshTokenPayload,
                REFRESH_TOKEN_SECRET,
                { expiresIn: REFRESH_TOKEN_EXPIRY }
            );

            // Step 6: Save refresh token to database (for revocation capability)
            user.refresh_token = refreshToken;
            await user.save();

            // Step 7: Prepare user data (exclude sensitive fields)
            const userData = {
                user_id: user.user_id,
                email: user.email,
                full_name: user.full_name,
                address: user.address,
                role: user.role,
                rating_score: user.rating_score,
                upgrade_at: user.upgrade_at,
                created_at: user.created_at
            };

            return {
                user: userData,
                accessToken,
                refreshToken
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Logout user by invalidating refresh token
     * @param {number} userId - User's ID
     * @returns {Promise<boolean>} - Success status
     */
    async logout(userId) {
        try {
            const user = await User.findByPk(userId);
            
            if (!user) {
                throw new Error('User not found');
            }

            // Clear refresh token from database
            user.refresh_token = null;
            await user.save();

            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Refresh access token using refresh token
     * @param {string} refreshToken - Current refresh token
     * @returns {Promise<Object>} - New access token
     */
    async refreshAccessToken(refreshToken) {
        try {
            // Step 1: Verify refresh token
            const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

            // Step 2: Find user and check if refresh token matches
            const user = await User.findByPk(decoded.user_id);
            
            if (!user) {
                throw new Error('User not found');
            }

            if (user.refresh_token !== refreshToken) {
                throw new Error('Invalid refresh token');
            }

            // Step 3: Generate new access token
            const accessTokenPayload = {
                user_id: user.user_id,
                email: user.email,
                role: user.role
            };
            
            const newAccessToken = jwt.sign(
                accessTokenPayload,
                ACCESS_TOKEN_SECRET,
                { expiresIn: ACCESS_TOKEN_EXPIRY }
            );

            return {
                accessToken: newAccessToken
            };

        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                throw new Error('Invalid refresh token');
            }
            if (error.name === 'TokenExpiredError') {
                throw new Error('Refresh token has expired');
            }
            throw error;
        }
    }
}

module.exports = new AuthorizationService();