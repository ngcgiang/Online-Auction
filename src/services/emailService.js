const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();
class emailService{
    async sendEmail(toEmail,otpCode) {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject: 'Xác thực tài khoản',
            text: `Mã xác thực của bạn là: ${otpCode}`
        };

        await transporter.sendMail(mailOptions);
    }
}

module.exports = new emailService();