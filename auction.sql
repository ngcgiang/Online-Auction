-- Tạo Database
CREATE DATABASE IF NOT EXISTS auction_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE auction_db;

-- 1. Bảng Users
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Lưu hash bcrypt
    full_name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    dob DATE,
    role ENUM('admin', 'seller', 'bidder') DEFAULT 'bidder',
    rating_score FLOAT DEFAULT 0, -- Điểm đánh giá tích luỹ
    otp_code VARCHAR(10), -- Mã OTP xác thực
    otp_expiry DATETIME, -- Thời gian hết hạn OTP
    is_verified BOOLEAN DEFAULT FALSE, -- Đã xác thực email chưa
    upgrade_request BOOLEAN DEFAULT FALSE, -- Có đang xin nâng cấp không
    upgrade_at DATETIME, -- Thời điểm xin nâng cấp
    refresh_token text, -- Lưu refresh token cho việc đăng nhập lâu dài
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Category (Danh mục)
CREATE TABLE Categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    parent_id INT DEFAULT NULL, -- NULL là cấp 1, có ID là cấp 2
    FOREIGN KEY (parent_id) REFERENCES Categories(category_id) ON DELETE SET NULL
);

-- 3. Bảng Products (Sản phẩm)
CREATE TABLE Products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    category_id INT,
    seller_id INT NOT NULL,
    winner_id INT DEFAULT NULL, -- Người đang giữ giá cao nhất (hiện tại) hoặc thắng cuộc (khi hết giờ)
    
    start_value DECIMAL(15, 2) NOT NULL, -- Giá khởi điểm
    current_price DECIMAL(15, 2) DEFAULT 0, -- Giá hiện tại (Công thức: Giá max nhì + bước giá)
    buy_now_value DECIMAL(15, 2) DEFAULT NULL,
    price_step DECIMAL(15, 2) NOT NULL, -- Bước giá
    
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    
    status ENUM('active', 'sold', 'expired') DEFAULT 'active',
    
    permission bool default false,
    auto_renewal bool default true, 
    
    FOREIGN KEY (category_id) REFERENCES Categories(category_id),
    FOREIGN KEY (seller_id) REFERENCES Users(user_id),
    FOREIGN KEY (winner_id) REFERENCES Users(user_id),
    FULLTEXT (product_name)
);  

-- 4. Bảng Product Descriptions (Mô tả bổ sung - Yêu cầu 3.2)
CREATE TABLE ProductDescriptions (
    des_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    description TEXT NOT NULL, -- Hỗ trợ HTML từ WYSIWYG
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE
);

-- 5. Bảng Images (Ảnh sản phẩm)
CREATE TABLE ProductImages (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    img_url VARCHAR(255) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE
);

-- 6. Bảng Bids (Lịch sử đấu giá)
CREATE TABLE Bids (
    bid_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    bidder_id INT NOT NULL,
    
    -- Đây là số tiền TỐI ĐA user chấp nhận trả (Max Bid)
    amount DECIMAL(15, 2) NOT NULL, 
    
    bid_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Trạng thái bid: 
    -- 1 (hợp lệ)
    -- 0 (bị ẩn/huỷ do user bị denied hoặc huỷ kèo)
    status TINYINT DEFAULT 1, 
    
    FOREIGN KEY (product_id) REFERENCES Products(product_id),
    FOREIGN KEY (bidder_id) REFERENCES Users(user_id)
);

-- 8. Bảng Watchlist (Yêu thích)
CREATE TABLE Watchlists (
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    PRIMARY KEY (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);

-- 9. Bảng QuestionAnswers (Hỏi đáp)
CREATE TABLE QuestionAnswers (
    comment_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    parent_comment_id INT DEFAULT NULL, -- Nếu NULL là câu hỏi, có ID là câu trả lời
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES Products(product_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (parent_comment_id) REFERENCES QuestionAnswers(comment_id)
);

-- 10. Bảng Orders (Đơn hàng sau đấu giá - Yêu cầu 7)
CREATE TABLE Orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    winner_id INT NOT NULL,
    seller_id INT NOT NULL,
    
    total_amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50), -- MOMO, ZALOPAY...
    shipping_address VARCHAR(255),
    
    delivery_status ENUM('pending', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    order_status ENUM('unpaid', 'paid', 'cancelled') DEFAULT 'unpaid',
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Products(product_id),
    FOREIGN KEY (winner_id) REFERENCES Users(user_id),
    FOREIGN KEY (seller_id) REFERENCES Users(user_id)
);

-- 11. Bảng Rating (Đánh giá người dùng)
CREATE TABLE Ratings (
    rating_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL, -- Người bị đánh giá (Seller hoặc Bidder thắng)
    reviewer_id INT NOT NULL, -- Người đánh giá
    product_id INT NOT NULL, -- Đánh giá dựa trên giao dịch nào
    rating_point INT CHECK (rating_point IN (1, -1)), -- +1 hoặc -1
    content VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (reviewer_id) REFERENCES Users(user_id),
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);

-- 12. Bảng RefusedBidder (Người bị từ chối - Yêu cầu 3.3)
CREATE TABLE IF NOT EXISTS RefusedBidders (
  refused_id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  bidder_id INT NOT NULL,
  refused_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE,
  FOREIGN KEY (bidder_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  
  -- Prevent duplicate refusals
  UNIQUE KEY unique_product_bidder (product_id, bidder_id),
  
  -- Indexes for better query performance
  INDEX idx_product_id (product_id),
  INDEX idx_bidder_id (bidder_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 13. Bảng Messages (Chat - Yêu cầu 7)
CREATE TABLE Messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    sender_id INT NOT NULL,
    content TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES Products(product_id),
    FOREIGN KEY (sender_id) REFERENCES Users(user_id)
);

CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE, -- Tên biến cấu hình (VD: AUCTION_TIME)
    setting_value TEXT NOT NULL,              -- Giá trị (Lưu dạng chuỗi)
    description VARCHAR(255),                 -- Mô tả để Admin đọc hiểu
    data_type VARCHAR(20) DEFAULT 'string',   -- Loại dữ liệu: 'number', 'boolean', 'string', 'json'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Categories
INSERT INTO Categories (category_name, parent_id) VALUES 
('Điện tử', NULL),
('Thời trang', NULL),
('Điện thoại di động', 1),
('Laptop', 1),
('Giày dép', 2);

-- Insert Users
-- Pass: '123456' (Giả sử đã hash)
INSERT INTO Users (email, password, full_name, address, role, rating_score) VALUES 
('admin@auction.com', '$2b$10$xxxxx', 'Quản Trị Viên', 'Hà Nội', 'admin', 0),
('seller1@auction.com', '$2b$10$xxxxx', 'Nguyễn Văn Bán', 'TP.HCM', 'seller', 0.9),
('bidder1@auction.com', '$2b$10$xxxxx', 'Trần Mua', 'Đà Nẵng', 'bidder', 1.0),
('bidder2@auction.com', '$2b$10$xxxxx', 'Lê Săn Hàng', 'Cần Thơ', 'bidder', 0.8),
('bidder3@auction.com', '$2b$10$xxxxx', 'Phạm Đấu Giá', 'Hải Phòng', 'bidder', 0.5);

-- 1. Tạo sản phẩm
INSERT INTO Products (product_name, category_id, seller_id, start_value, current_price, price_step, start_time, end_time) 
VALUES 
('iPhone 15 Pro Max', 3, 2, 10000000, 10000000, 100000, NOW(), DATE_ADD(NOW(), INTERVAL 3 DAY));

-- 2. Giả lập quá trình đấu giá
-- Người A (bidder1) vào đặt giá trần 12tr
INSERT INTO Bids (product_id, bidder_id, amount, bid_time) VALUES (1, 3, 12000000, '2025-10-27 08:00:00');
-- Lúc này trong code backend sẽ update Product: current_price = 10tr (giá sàn), winner = bidder1

-- Người B (bidder2) vào đặt giá trần 11tr
INSERT INTO Bids (product_id, bidder_id, amount, bid_time) VALUES (1, 4, 11000000, '2025-10-27 09:00:00');
-- Backend xử lý: 
-- Max 1 = 12tr (A), Max 2 = 11tr (B).
-- Giá mới = 11tr + 100k = 11.100.000
-- Update Product: current_price = 11100000, winner = bidder1

-- Người C (bidder3) vào đặt giá trần 15tr
INSERT INTO Bids (product_id, bidder_id, amount, bid_time) VALUES (1, 5, 15000000, '2025-10-27 10:00:00');
-- Backend xử lý:
-- Max 1 = 15tr (C), Max 2 = 12tr (A).
-- Giá mới = 12tr + 100k = 12.100.000
-- Update Product: current_price = 12100000, winner = bidder3

-- Insert Product Descriptions (Yêu cầu 3.2: Có thể append nhiều dòng)
INSERT INTO ProductDescriptions (product_id, description, created_at) VALUES
(1, '<p>Hàng chính hãng VN/A, mới 99%</p>', NOW()),
(1, '<p>Cập nhật: Đã dán cường lực xịn</p>', DATE_ADD(NOW(), INTERVAL 1 HOUR));

-- Insert Product Images
INSERT INTO ProductImages (product_id, img_url) VALUES
(1, 'https://example.com/iphone_front.jpg'),
(1, 'https://example.com/iphone_back.jpg'),
(1, 'https://example.com/iphone_box.jpg');

-- Update giá hiện tại cho sản phẩm 3 sau khi bid
UPDATE Products SET current_price = 2500000 WHERE product_id = 3;

-- Insert Watchlist
INSERT INTO Watchlists (user_id, product_id) VALUES (3, 1), (4, 1);

-- Insert Question & Answer
INSERT INTO QuestionAnswers (product_id, user_id, content, parent_comment_id) VALUES
(1, 3, 'Máy còn bảo hành không shop?', NULL), -- Câu hỏi
(1, 2, 'Còn bảo hành Apple Care 6 tháng nhé bạn.', 1); -- Trả lời (id 1)

INSERT INTO system_settings (setting_key, setting_value, description, data_type) VALUES 
-- Cấu hình: Nếu có bid trong 5 phút cuối
('AUCTION_EXTEND_TRIGGER_MINUTES', '5', 'Thời gian (phút) trước khi kết thúc để kích hoạt gia hạn', 'number'),
('AUCTION_EXTEND_DURATION_MINUTES', '10', 'Thời gian (phút) được cộng thêm khi kích hoạt gia hạn', 'number')