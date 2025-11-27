const UserService = require('../services/userService');
const EmailService = require('../services/emailService');

const registerUser = async (req, res) => {
    try {
        const userData = req.body;
        const newUser = await UserService.createUser(userData);         // Generate a 6-digit OTP code
        EmailService.sendEmail(newUser.email,newUser.otp_code);
        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user_id: newUser.user_id,
                username: newUser.username,
                email: newUser.email,
                address: newUser.address,
                otpCode: newUser.otp_code
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
        const newOtpCode = await UserService.updateOtpCode(email);
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
        const user = await UserService.verifyUser(email, otpCode);

        return res.status(200).json({
            success: true,
            message: 'User verified successfully',
            data: {
                user_id: user.user_id,
                username: user.username,
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
module.exports = {
    registerUser,
    verifyUser,
    resendOtp
};