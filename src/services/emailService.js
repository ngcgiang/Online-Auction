const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

class emailService {
    /**
     * Create reusable transporter
     * @private
     */
    _createTransporter() {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    /**
     * Send OTP verification email
     */
    async sendEmail(toEmail, otpCode) {
        const transporter = this._createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject: 'Xác thực tài khoản',
            text: `Mã xác thực của bạn là: ${otpCode}`
        };

        await transporter.sendMail(mailOptions);
    }

    /**
     * Send Q&A notification email
     */
    async sendQAEmail(toEmails, message, link) {
        const transporter = this._createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            bcc: toEmails,
            subject: 'Thông báo từ hệ thống Online Auction',
            text: message,
            html: `<p>${message}</p><a href="${link}">Click here</a>`
        };

        await transporter.sendMail(mailOptions);
    }

    /**
     * Send bid notification to seller
     * @param {string} sellerEmail - Seller's email address
     * @param {Object} bidData - Bid information
     */
    async sendBidNotificationToSeller(sellerEmail, bidData) {
        const transporter = this._createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: sellerEmail,
            subject: `🔔 Có người đấu giá sản phẩm: ${bidData.product_name}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
                        <h2 style="color: #4CAF50;">🎉 Tin tốt! Có người vừa đấu giá sản phẩm của bạn</h2>
                        <hr style="border: 1px solid #eee;">
                        
                        <p><strong>Sản phẩm:</strong> ${bidData.product_name}</p>
                        <p><strong>Giá hiện tại:</strong> <span style="color: #FF5722; font-size: 20px; font-weight: bold;">${bidData.new_price.toLocaleString('vi-VN')} VNĐ</span></p>
                        <p><strong>Người đấu giá:</strong> Người dùng #${bidData.new_bidder_id}</p>
                        <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
                        
                        <div style="margin-top: 30px; text-align: center;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/products/${bidData.product_id}" 
                               style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                Xem chi tiết sản phẩm
                            </a>
                        </div>
                        
                        <p style="margin-top: 30px; color: #777; font-size: 12px;">
                            Email này được gửi tự động từ hệ thống Online Auction. Vui lòng không trả lời email này.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ [Email] Bid notification sent to seller: ${sellerEmail}`);
    }

    /**
     * Send bid confirmation to new bidder
     * @param {string} bidderEmail - New bidder's email address
     * @param {Object} bidData - Bid information
     */
    async sendBidConfirmationToNewBidder(bidderEmail, bidData) {
        const transporter = this._createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: bidderEmail,
            subject: `✅ Đấu giá thành công: ${bidData.product_name}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
                        <h2 style="color: #2196F3;">✅ Đấu giá thành công!</h2>
                        <hr style="border: 1px solid #eee;">
                        
                        <p>Chúc mừng! Bạn đã đặt giá thành công cho sản phẩm:</p>
                        <p><strong>Sản phẩm:</strong> ${bidData.product_name}</p>
                        <p><strong>Giá đấu của bạn:</strong> <span style="color: #2196F3; font-size: 20px; font-weight: bold;">${bidData.new_price.toLocaleString('vi-VN')} VNĐ</span></p>
                        <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
                        
                        <div style="background-color: #E3F2FD; padding: 15px; border-radius: 5px; margin-top: 20px;">
                            <p style="margin: 0; color: #1565C0;">
                                💡 <strong>Lưu ý:</strong> Bạn đang dẫn đầu cuộc đấu giá này. Chúng tôi sẽ thông báo nếu có người đặt giá cao hơn.
                            </p>
                        </div>
                        
                        <div style="margin-top: 30px; text-align: center;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/products/${bidData.product_id}" 
                               style="background-color: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                Theo dõi đấu giá
                            </a>
                        </div>
                        
                        <p style="margin-top: 30px; color: #777; font-size: 12px;">
                            Email này được gửi tự động từ hệ thống Online Auction. Vui lòng không trả lời email này.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ [Email] Bid confirmation sent to new bidder: ${bidderEmail}`);
    }

    /**
     * Send outbid notification to previous winner
     * @param {string} previousWinnerEmail - Previous winner's email address
     * @param {Object} bidData - Bid information
     */
    async sendOutbidNotificationToPreviousWinner(previousWinnerEmail, bidData) {
        const transporter = this._createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: previousWinnerEmail,
            subject: `⚠️ Bạn đã bị vượt giá: ${bidData.product_name}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
                        <h2 style="color: #FF9800;">⚠️ Ai đó đã đặt giá cao hơn bạn!</h2>
                        <hr style="border: 1px solid #eee;">
                        
                        <p>Rất tiếc! Bạn không còn dẫn đầu cuộc đấu giá:</p>
                        <p><strong>Sản phẩm:</strong> ${bidData.product_name}</p>
                        <p><strong>Giá hiện tại:</strong> <span style="color: #FF9800; font-size: 20px; font-weight: bold;">${bidData.new_price.toLocaleString('vi-VN')} VNĐ</span></p>
                        <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
                        
                        <div style="background-color: #FFF3E0; padding: 15px; border-radius: 5px; margin-top: 20px;">
                            <p style="margin: 0; color: #E65100;">
                                💡 <strong>Hành động:</strong> Đặt giá cao hơn ngay để giành lại vị trí dẫn đầu!
                            </p>
                        </div>
                        
                        <div style="margin-top: 30px; text-align: center;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/products/${bidData.product_id}" 
                               style="background-color: #FF9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                Đấu giá lại ngay
                            </a>
                        </div>
                        
                        <p style="margin-top: 30px; color: #777; font-size: 12px;">
                            Email này được gửi tự động từ hệ thống Online Auction. Vui lòng không trả lời email này.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ [Email] Outbid notification sent to previous winner: ${previousWinnerEmail}`);
    }
}

module.exports = new emailService();
