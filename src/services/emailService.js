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
    async sendVerificationEmail(toEmail, otpCode) {
        const transporter = this._createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject: 'Xác thực tài khoản - Online Auction',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #2196F3; margin-bottom: 20px;">🔐 Xác thực tài khoản</h2>
                        <hr style="border: 1px solid #eee; margin-bottom: 20px;">
                        
                        <p style="font-size: 16px; color: #333; line-height: 1.6;">
                            Chào mừng bạn đến với <strong>Online Auction</strong>!
                        </p>
                        <p style="font-size: 16px; color: #333; line-height: 1.6;">
                            Để hoàn tất đăng ký tài khoản, vui lòng sử dụng mã OTP bên dưới:
                        </p>
                        
                        <div style="background-color: #E3F2FD; padding: 20px; border-radius: 5px; margin: 25px 0; text-align: center;">
                            <p style="margin: 0; color: #1565C0; font-size: 14px; font-weight: 500;">MÃ XÁC THỰC CỦA BẠN</p>
                            <p style="font-size: 32px; font-weight: bold; color: #2196F3; margin: 10px 0; letter-spacing: 5px;">
                                ${otpCode}
                            </p>
                            <p style="margin: 0; color: #666; font-size: 12px;">Mã có hiệu lực trong 10 phút</p>
                        </div>
                        
                        <div style="background-color: #FFF3E0; padding: 15px; border-radius: 5px; border-left: 4px solid #FF9800;">
                            <p style="margin: 0; color: #E65100; font-size: 14px;">
                                ⚠️ <strong>Lưu ý:</strong> Không chia sẻ mã này với bất kỳ ai. Nhân viên Online Auction sẽ không bao giờ yêu cầu mã OTP của bạn.
                            </p>
                        </div>
                        
                        <p style="margin-top: 30px; color: #777; font-size: 12px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
                            Email này được gửi tự động từ hệ thống Online Auction.<br>
                            Vui lòng không trả lời email này.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ [Email] Verification email sent to: ${toEmail}`);
    }

    /**
     * Send password reset notification by admin
     */
    async sendPasswordResetByAdminEmail(toEmail, newPassword, adminName = 'Admin') {
        const transporter = this._createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject: '🔑 Mật khẩu của bạn đã được thay đổi - Online Auction',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #FF5722; margin-bottom: 20px;">🔑 Mật khẩu đã được thay đổi</h2>
                        <hr style="border: 1px solid #eee; margin-bottom: 20px;">
                        
                        <p style="font-size: 16px; color: #333; line-height: 1.6;">
                            Xin chào,
                        </p>
                        <p style="font-size: 16px; color: #333; line-height: 1.6;">
                            Quản trị viên <strong>${adminName}</strong> đã thay đổi mật khẩu cho tài khoản của bạn trên hệ thống Online Auction.
                        </p>
                        
                        <div style="background-color: #FFEBEE; padding: 20px; border-radius: 5px; margin: 25px 0;">
                            <p style="margin: 0 0 10px 0; color: #C62828; font-size: 14px; font-weight: 500;">MẬT KHẨU MỚI CỦA BẠN</p>
                            <p style="font-size: 24px; font-weight: bold; color: #FF5722; margin: 10px 0; letter-spacing: 2px; font-family: monospace;">
                                ${newPassword}
                            </p>
                        </div>
                        
                        <div style="background-color: #FFF3E0; padding: 15px; border-radius: 5px; border-left: 4px solid #FF9800; margin: 20px 0;">
                            <p style="margin: 0; color: #E65100; font-size: 14px;">
                                ⚠️ <strong>Khuyến nghị bảo mật:</strong>
                            </p>
                            <ul style="color: #E65100; font-size: 14px; margin: 10px 0; padding-left: 20px;">
                                <li>Đăng nhập và đổi mật khẩu ngay lập tức</li>
                                <li>Chọn mật khẩu mạnh và không chia sẻ với ai</li>
                                <li>Nếu bạn không yêu cầu thay đổi này, vui lòng liên hệ quản trị viên ngay</li>
                            </ul>
                        </div>
                        
                        <div style="margin-top: 30px; text-align: center;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" 
                               style="background-color: #FF5722; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: 500;">
                                Đăng nhập ngay
                            </a>
                        </div>
                        
                        <p style="margin-top: 30px; color: #777; font-size: 12px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
                            Email này được gửi tự động từ hệ thống Online Auction.<br>
                            Vui lòng không trả lời email này.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ [Email] Password reset notification sent to: ${toEmail}`);
    }

    /**
     * Send Q&A notification email
     */
    async sendQAEmail(toEmails, message, product_id) {
        const transporter = this._createTransporter();
        const base_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
        const productLink = `${base_URL}/products/${product_id}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            bcc: toEmails,
            subject: 'Thông báo Q&A sản phẩm - Online Auction',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #2196F3; margin-bottom: 20px;">📢 Thông báo Q&A sản phẩm</h2>
                        <hr style="border: 1px solid #eee; margin-bottom: 20px;">
                        
                        <p style="font-size: 16px; color: #333; line-height: 1.6;">${message}</p>
                        
                        <div style="margin-top: 30px; text-align: center;">
                            <a href="${productLink}" 
                               style="background-color: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: 500;">
                                Xem chi tiết sản phẩm
                            </a>
                        </div>
                        
                        <p style="margin-top: 30px; color: #777; font-size: 12px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
                            Email này được gửi tự động từ hệ thống Online Auction.<br>
                            Vui lòng không trả lời email này.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ [Email] Q&A notification sent to ${toEmails.length} recipients`);
    }

    /**
     * Send update description notification to bidders
     */
    async sendUpdateDescriptionEmail(toEmails, productName, product_id) {
        const transporter = this._createTransporter();
        const base_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
        const productLink = `${base_URL}/product/${product_id}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            bcc: toEmails,
            subject: `📝 Cập nhật mô tả sản phẩm: ${productName}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
                        <h2 style="color: #FF5722;">📝 Mô tả sản phẩm đã được cập nhật</h2>
                        <hr style="border: 1px solid #eee;">
                        <p style="font-size: 16px; color: #333;">
                            Mô tả của sản phẩm <strong>${productName}</strong> đã được người bán cập nhật. Hãy kiểm tra để biết thêm chi tiết!
                        </p>
                        <div style="margin-top: 20px;">
                            <a href="${productLink}" 
                               style="background-color: #FF5722; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                Xem sản phẩm
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
        console.log(`✅ [Email] Update description notification sent to bidders: ${toEmails}`);
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
                    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #4CAF50; margin-bottom: 20px;">🎉 Tin tốt! Có người vừa đấu giá sản phẩm của bạn</h2>
                        <hr style="border: 1px solid #eee; margin-bottom: 20px;">
                        
                        <p style="font-size: 16px; color: #333;"><strong>Sản phẩm:</strong> ${bidData.product_name}</p>
                        <p style="font-size: 16px; color: #333;"><strong>Giá hiện tại:</strong> <span style="color: #FF5722; font-size: 20px; font-weight: bold;">${bidData.new_price.toLocaleString('vi-VN')} VNĐ</span></p>
                        <p style="font-size: 16px; color: #333;"><strong>Người đấu giá:</strong> Người dùng #${bidData.new_bidder_id}</p>
                        <p style="font-size: 16px; color: #333;"><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
                        
                        <div style="margin-top: 30px; text-align: center;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/product/${bidData.product_id}" 
                               style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: 500;">
                                Xem chi tiết sản phẩm
                            </a>
                        </div>
                        
                        <p style="margin-top: 30px; color: #777; font-size: 12px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
                            Email này được gửi tự động từ hệ thống Online Auction.<br>
                            Vui lòng không trả lời email này.
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
                    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #2196F3; margin-bottom: 20px;">✅ Đấu giá thành công!</h2>
                        <hr style="border: 1px solid #eee; margin-bottom: 20px;">
                        
                        <p style="font-size: 16px; color: #333; line-height: 1.6;">Chúc mừng! Bạn đã đặt giá thành công cho sản phẩm:</p>
                        <p style="font-size: 16px; color: #333;"><strong>Sản phẩm:</strong> ${bidData.product_name}</p>
                        <p style="font-size: 16px; color: #333;"><strong>Giá đấu của bạn:</strong> <span style="color: #2196F3; font-size: 20px; font-weight: bold;">${bidData.amount_bid.toLocaleString('vi-VN')} VNĐ</span></p>
                        <p style="font-size: 16px; color: #333;"><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
                        
                        <div style="background-color: #E3F2FD; padding: 15px; border-radius: 5px; border-left: 4px solid #2196F3; margin: 20px 0;">
                            <p style="margin: 0; color: #1565C0; font-size: 14px;">
                                💡 <strong>Lưu ý:</strong> Bạn đang dẫn đầu cuộc đấu giá này. Chúng tôi sẽ thông báo nếu có người đặt giá cao hơn.
                            </p>
                        </div>
                        
                        <div style="margin-top: 30px; text-align: center;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/product/${bidData.product_id}" 
                               style="background-color: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: 500;">
                                Theo dõi đấu giá
                            </a>
                        </div>
                        
                        <p style="margin-top: 30px; color: #777; font-size: 12px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
                            Email này được gửi tự động từ hệ thống Online Auction.<br>
                            Vui lòng không trả lời email này.
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
                    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #FF9800; margin-bottom: 20px;">⚠️ Ai đó đã đặt giá cao hơn bạn!</h2>
                        <hr style="border: 1px solid #eee; margin-bottom: 20px;">
                        
                        <p style="font-size: 16px; color: #333; line-height: 1.6;">Rất tiếc! Bạn không còn dẫn đầu cuộc đấu giá:</p>
                        <p style="font-size: 16px; color: #333;"><strong>Sản phẩm:</strong> ${bidData.product_name}</p>
                        <p style="font-size: 16px; color: #333;"><strong>Giá hiện tại:</strong> <span style="color: #FF9800; font-size: 20px; font-weight: bold;">${bidData.new_price.toLocaleString('vi-VN')} VNĐ</span></p>
                        <p style="font-size: 16px; color: #333;"><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
                        
                        <div style="background-color: #FFF3E0; padding: 15px; border-radius: 5px; border-left: 4px solid #FF9800; margin: 20px 0;">
                            <p style="margin: 0; color: #E65100; font-size: 14px;">
                                💡 <strong>Hành động:</strong> Đặt giá cao hơn ngay để giành lại vị trí dẫn đầu!
                            </p>
                        </div>
                        
                        <div style="margin-top: 30px; text-align: center;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/product/${bidData.product_id}" 
                               style="background-color: #FF9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: 500;">
                                Đấu giá lại ngay
                            </a>
                        </div>
                        
                        <p style="margin-top: 30px; color: #777; font-size: 12px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
                            Email này được gửi tự động từ hệ thống Online Auction.<br>
                            Vui lòng không trả lời email này.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ [Email] Outbid notification sent to previous winner: ${previousWinnerEmail}`);
    }

    /**
     * Send auction ended notification to seller (no bids)
     * @param {string} sellerEmail - Seller's email address
     * @param {Object} auctionData - Auction information
     */
    async sendAuctionEndedNoBidsEmail(sellerEmail, auctionData) {
        const transporter = this._createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: sellerEmail,
            subject: `📭 Phiên đấu giá kết thúc: ${auctionData.product_name}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #9E9E9E; margin-bottom: 20px;">📭 Phiên đấu giá đã kết thúc</h2>
                        <hr style="border: 1px solid #eee; margin-bottom: 20px;">
                        
                        <p style="font-size: 16px; color: #333; line-height: 1.6;">Phiên đấu giá của sản phẩm đã kết thúc nhưng không có người đặt giá:</p>
                        <p style="font-size: 16px; color: #333;"><strong>Sản phẩm:</strong> ${auctionData.product_name}</p>
                        <p style="font-size: 16px; color: #333;"><strong>Thời gian kết thúc:</strong> ${new Date(auctionData.end_time).toLocaleString('vi-VN')}</p>
                        
                        <div style="background-color: #F5F5F5; padding: 15px; border-radius: 5px; border-left: 4px solid #9E9E9E; margin: 20px 0;">
                            <p style="margin: 0; color: #616161; font-size: 14px;">
                                💡 <strong>Gợi ý:</strong> Bạn có thể đăng lại sản phẩm này với giá khởi điểm thấp hơn hoặc điều chỉnh thời gian đấu giá.
                            </p>
                        </div>
                        
                        <div style="margin-top: 30px; text-align: center;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/seller/products" 
                               style="background-color: #9E9E9E; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: 500;">
                                Quản lý sản phẩm
                            </a>
                        </div>
                        
                        <p style="margin-top: 30px; color: #777; font-size: 12px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
                            Email này được gửi tự động từ hệ thống Online Auction.<br>
                            Vui lòng không trả lời email này.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ [Email] Auction ended (no bids) notification sent to seller: ${sellerEmail}`);
    }

    /**
     * Send auction won notification to seller
     * @param {string} sellerEmail - Seller's email address
     * @param {Object} auctionData - Auction information
     */
    async sendAuctionWonEmailToSeller(sellerEmail, auctionData) {
        const transporter = this._createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: sellerEmail,
            subject: `🎉 Sản phẩm đã có người thắng: ${auctionData.product_name}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #4CAF50; margin-bottom: 20px;">🎉 Chúc mừng! Sản phẩm của bạn đã được bán</h2>
                        <hr style="border: 1px solid #eee; margin-bottom: 20px;">
                        
                        <p style="font-size: 16px; color: #333;"><strong>Sản phẩm:</strong> ${auctionData.product_name}</p>
                        <p style="font-size: 16px; color: #333;"><strong>Giá bán:</strong> <span style="color: #4CAF50; font-size: 24px; font-weight: bold;">${auctionData.final_price.toLocaleString('vi-VN')} VNĐ</span></p>
                        <p style="font-size: 16px; color: #333;"><strong>Người thắng:</strong> ${auctionData.winner_name} (User #${auctionData.winner_id})</p>
                        <p style="font-size: 16px; color: #333;"><strong>Thời gian kết thúc:</strong> ${new Date(auctionData.end_time).toLocaleString('vi-VN')}</p>
                        
                        <div style="background-color: #E8F5E9; padding: 15px; border-radius: 5px; border-left: 4px solid #4CAF50; margin: 20px 0;">
                            <p style="margin: 0; color: #2E7D32; font-size: 14px;">
                                📦 <strong>Bước tiếp theo:</strong> Hãy liên hệ với người thắng để thỏa thuận về giao hàng và thanh toán.
                            </p>
                        </div>
                        
                        <div style="margin-top: 30px; text-align: center;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/product/${auctionData.product_id}" 
                               style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: 500;">
                                Xem chi tiết
                            </a>
                        </div>
                        
                        <p style="margin-top: 30px; color: #777; font-size: 12px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
                            Email này được gửi tự động từ hệ thống Online Auction.<br>
                            Vui lòng không trả lời email này.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ [Email] Auction won notification sent to seller: ${sellerEmail}`);
    }

    /**
     * Send auction won congratulations to winner
     * @param {string} winnerEmail - Winner's email address
     * @param {Object} auctionData - Auction information
     */
    async sendAuctionWonEmailToWinner(winnerEmail, auctionData) {
        const transporter = this._createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: winnerEmail,
            subject: `🏆 Chúc mừng! Bạn đã thắng: ${auctionData.product_name}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #FF9800; margin-bottom: 20px;">🏆 Chúc mừng! Bạn đã thắng đấu giá</h2>
                        <hr style="border: 1px solid #eee; margin-bottom: 20px;">
                        
                        <p style="font-size: 16px; color: #333; line-height: 1.6;">Bạn đã thắng phiên đấu giá:</p>
                        <p style="font-size: 16px; color: #333;"><strong>Sản phẩm:</strong> ${auctionData.product_name}</p>
                        <p style="font-size: 16px; color: #333;"><strong>Giá thắng:</strong> <span style="color: #FF9800; font-size: 24px; font-weight: bold;">${auctionData.final_price.toLocaleString('vi-VN')} VNĐ</span></p>
                        <p style="font-size: 16px; color: #333;"><strong>Thời gian kết thúc:</strong> ${new Date(auctionData.end_time).toLocaleString('vi-VN')}</p>
                        
                        <div style="background-color: #FFF3E0; padding: 15px; border-radius: 5px; border-left: 4px solid #FF9800; margin: 20px 0;">
                            <p style="margin: 0; color: #E65100; font-size: 14px;">
                                💳 <strong>Bước tiếp theo:</strong> Vui lòng thanh toán và liên hệ với người bán để nhận hàng.
                            </p>
                        </div>
                        
                        <div style="margin-top: 30px; text-align: center;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/product/${auctionData.product_id}" 
                               style="background-color: #FF9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: 500;">
                                Xem đơn hàng & Thanh toán
                            </a>
                        </div>
                        
                        <p style="margin-top: 30px; color: #777; font-size: 12px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
                            Email này được gửi tự động từ hệ thống Online Auction.<br>
                            Vui lòng không trả lời email này.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ [Email] Congratulations email sent to winner: ${winnerEmail}`);
    }
}

module.exports = new emailService();