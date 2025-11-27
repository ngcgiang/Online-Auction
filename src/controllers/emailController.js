const emailService = require('../services/emailService');

const sendVerificationEmail = async (req, res) => {
    try {
        const { toEmail, otpCode } = req.body;
        await emailService.sendEmail(toEmail, otpCode);
        return res.status(200).json({
            success: true,
            message: 'Verification email sent successfully'
        });
    } catch (error) {
        console.error('Error sending verification email:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send verification email'
        });
    }
};

module.exports = {
    sendVerificationEmail
};