-- ================================
-- AUCTION DATABASE SCHEMA
-- ================================
-- Create Database
CREATE DATABASE IF NOT EXISTS online_auction_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE online_auction_db;

-- ================================
-- TABLE DEFINITIONS
-- ================================

-- 1. Users Table
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    google_id VARCHAR(255) UNIQUE DEFAULT NULL,
    password VARCHAR(255), -- Bcrypt hash (nullable for Google OAuth users)
    full_name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    dob DATE,
    role ENUM('admin', 'seller', 'bidder') DEFAULT 'bidder',
    rating_score FLOAT DEFAULT 0,
    otp_code VARCHAR(10),
    otp_expiry DATETIME,
    is_verified BOOLEAN DEFAULT FALSE,
    upgrade_request BOOLEAN DEFAULT FALSE,
    upgrade_at DATETIME,
    refresh_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Categories Table
CREATE TABLE Categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    parent_id INT DEFAULT NULL, -- NULL = Level 1, ID = Level 2
    FOREIGN KEY (parent_id) REFERENCES Categories(category_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Products Table
CREATE TABLE Products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    category_id INT,
    seller_id INT NOT NULL,
    winner_id INT DEFAULT NULL, -- Current highest bidder or auction winner
    
    start_value DECIMAL(15, 2) NOT NULL, -- Starting price
    current_price DECIMAL(15, 2) DEFAULT 0, -- Current price (second highest + step)
    buy_now_value DECIMAL(15, 2) DEFAULT NULL,
    price_step DECIMAL(15, 2) NOT NULL, -- Price increment
    
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    
    status ENUM('active', 'sold', 'expired') DEFAULT 'active',
    
    permission BOOLEAN DEFAULT FALSE,
    auto_renewal BOOLEAN DEFAULT TRUE, 
    
    FOREIGN KEY (category_id) REFERENCES Categories(category_id),
    FOREIGN KEY (seller_id) REFERENCES Users(user_id),
    FOREIGN KEY (winner_id) REFERENCES Users(user_id),
    FULLTEXT (product_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Product Descriptions Table
CREATE TABLE ProductDescriptions (
    des_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    description TEXT NOT NULL, -- HTML content from WYSIWYG editor
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Product Images Table
CREATE TABLE ProductImages (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    img_url VARCHAR(255) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Bids Table (Auction History)
CREATE TABLE Bids (
    bid_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    bidder_id INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL, -- Maximum bid amount
    bid_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TINYINT DEFAULT 1, -- 1 = valid, 0 = hidden/cancelled
    
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (bidder_id) REFERENCES Users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Watchlist Table
CREATE TABLE Watchlists (
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    PRIMARY KEY (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Question & Answers Table
CREATE TABLE QuestionAnswers (
    comment_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    parent_comment_id INT DEFAULT NULL, -- NULL = question, ID = answer
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES QuestionAnswers(comment_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Orders Table
CREATE TABLE Orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    winner_id INT NOT NULL,
    seller_id INT NOT NULL,
    
    total_amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50), -- MOMO, ZALOPAY, etc.
    shipping_address VARCHAR(255),
    
    delivery_status ENUM('pending', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    order_status ENUM('unpaid', 'paid', 'cancelled') DEFAULT 'unpaid',
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (winner_id) REFERENCES Users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES Users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Ratings Table
CREATE TABLE Ratings (
    rating_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL, -- User being rated (seller or winning bidder)
    reviewer_id INT NOT NULL, -- User giving the rating
    product_id INT NOT NULL, -- Related product/transaction
    rating_point INT CHECK (rating_point IN (1, -1)), -- +1 or -1
    content VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES Users(user_id),
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Refused Bidders Table
CREATE TABLE RefusedBidders (
    refused_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    bidder_id INT NOT NULL,
    refused_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (bidder_id) REFERENCES Users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Prevent duplicate refusals
    UNIQUE KEY unique_product_bidder (product_id, bidder_id),
    
    -- Indexes for better query performance
    INDEX idx_product_id (product_id),
    INDEX idx_bidder_id (bidder_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Messages Table (Chat)
CREATE TABLE Messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    sender_id INT NOT NULL,
    content TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES Products(product_id),
    FOREIGN KEY (sender_id) REFERENCES Users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. System Settings Table
CREATE TABLE system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE, -- Configuration key (e.g., AUCTION_TIME)
    setting_value TEXT NOT NULL, -- Value (stored as string)
    description VARCHAR(255), -- Description for admin reference
    data_type VARCHAR(20) DEFAULT 'string', -- Data type: 'number', 'boolean', 'string', 'json'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================
-- INITIAL SYSTEM SETTINGS
-- ================================

-- Auction extension configuration
INSERT INTO system_settings (setting_key, setting_value, description, data_type) VALUES 
('AUCTION_EXTEND_TRIGGER_MINUTES', '5', 'Time (minutes) before auction end to trigger extension', 'number'),
('AUCTION_EXTEND_DURATION_MINUTES', '10', 'Time (minutes) added when extension is triggered', 'number');

-- ================================
-- AUCTION DATABASE MOCK DATA
-- ================================

-- ================================
-- USERS MOCK DATA
-- ================================
-- Password for all users: '123456'
-- Bcrypt hash: $2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO

INSERT INTO Users (user_id, email, password, full_name, address, dob, role, rating_score, is_verified) VALUES
(1, 'admin1@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Nguyễn Văn Admin', '123 Lê Lợi, Quận 1, TP.HCM', '1985-03-15', 'admin', 1.0, TRUE),
(2, 'admin2@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Trần Thị Quản Trị', '456 Nguyễn Huệ, Quận 1, TP.HCM', '1987-07-20', 'admin', 1.0, TRUE),
(3, 'admin3@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Lê Văn Điều Hành', '789 Trần Hưng Đạo, Quận 5, TP.HCM', '1990-11-08', 'admin', 1.0, TRUE);

-- Seller Users (ID: 4-11)
INSERT INTO Users (user_id, email, password, full_name, address, dob, role, rating_score, is_verified) VALUES
(4, 'seller1@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Phạm Minh Bán', '12 Lý Thường Kiệt, Quận 10, TP.HCM', '1988-05-12', 'seller', 0.96, TRUE),
(5, 'seller2@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Võ Thị Kinh Doanh', '34 Hai Bà Trưng, Quận 3, TP.HCM', '1992-08-25', 'seller', 0.92, TRUE),
(6, 'seller3@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Hoàng Văn Thương', '56 Phan Đình Phùng, Quận Phú Nhuận, TP.HCM', '1989-12-03', 'seller', 0.98, TRUE),
(7, 'seller4@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Đặng Thị Mại', '78 Cách Mạng Tháng 8, Quận Tân Bình, TP.HCM', '1991-04-18', 'seller', 0.94, TRUE),
(8, 'seller5@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Bùi Văn Hàng', '90 Nguyễn Thị Minh Khai, Quận 1, TP.HCM', '1986-09-30', 'seller', 0.90, TRUE),
(9, 'seller6@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Ngô Thị Buôn', '23 Võ Văn Tần, Quận 3, TP.HCM', '1993-06-22', 'seller', 0.88, TRUE),
(10, 'seller7@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Dương Văn Chợ', '45 Lê Văn Sỹ, Quận Tân Bình, TP.HCM', '1990-02-14', 'seller', 0.86, TRUE),
(11, 'seller8@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Lý Thị Sạp', '67 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM', '1994-10-05', 'seller', 0.84, TRUE);

-- Bidder Users (ID: 12-40)
INSERT INTO Users (user_id, email, password, full_name, address, dob, role, rating_score, is_verified) VALUES
(12, 'bidder1@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Trương Văn Đấu', '11 Nguyễn Văn Linh, Quận 7, TP.HCM', '1995-01-10', 'bidder', 0.80, TRUE),
(13, 'bidder2@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Phan Thị Giá', '22 Xa Lộ Hà Nội, Quận 2, TP.HCM', '1996-03-22', 'bidder', 0.78, TRUE),
(14, 'bidder3@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Mai Văn Mua', '33 Võ Thị Sáu, Quận 3, TP.HCM', '1994-05-15', 'bidder', 0.82, TRUE),
(15, 'bidder4@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Hồ Thị Săn', '44 Pasteur, Quận 1, TP.HCM', '1993-07-28', 'bidder', 0.76, TRUE),
(16, 'bidder5@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Đinh Văn Thầu', '55 Cộng Hòa, Quận Tân Bình, TP.HCM', '1997-09-11', 'bidder', 0.84, TRUE),
(17, 'bidder6@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Lâm Thị Rao', '66 Hoàng Văn Thụ, Quận Tân Bình, TP.HCM', '1992-11-04', 'bidder', 0.74, TRUE),
(18, 'bidder7@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Cao Văn Chào', '77 Nguyễn Đình Chiểu, Quận 3, TP.HCM', '1998-02-17', 'bidder', 0.86, TRUE),
(19, 'bidder8@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Tô Thị Mặc', '88 Nam Kỳ Khởi Nghĩa, Quận 1, TP.HCM', '1991-04-30', 'bidder', 0.72, TRUE),
(20, 'bidder9@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Đỗ Văn Trả', '99 Lê Lai, Quận 1, TP.HCM', '1996-06-13', 'bidder', 0.88, TRUE),
(21, 'bidder10@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Vũ Thị Nhận', '101 Đinh Tiên Hoàng, Quận 1, TP.HCM', '1995-08-26', 'bidder', 0.70, TRUE),
(22, 'bidder11@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Hà Văn Lấy', '102 Tôn Đức Thắng, Quận 1, TP.HCM', '1994-10-09', 'bidder', 0.90, TRUE),
(23, 'bidder12@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Từ Thị Cho', '103 Phạm Ngũ Lão, Quận 1, TP.HCM', '1993-12-22', 'bidder', 0.68, TRUE),
(24, 'bidder13@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Lưu Văn Trao', '104 Bùi Viện, Quận 1, TP.HCM', '1997-01-05', 'bidder', 0.92, TRUE),
(25, 'bidder14@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Chu Thị Đổi', '105 Đề Thám, Quận 1, TP.HCM', '1992-03-18', 'bidder', 0.66, TRUE),
(26, 'bidder15@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Tạ Văn Thầu', '106 Cô Giang, Quận 1, TP.HCM', '1998-05-31', 'bidder', 0.94, TRUE),
(27, 'bidder16@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Đào Thị Giá', '107 Nguyễn Trãi, Quận 5, TP.HCM', '1991-07-14', 'bidder', 0.64, TRUE),
(28, 'bidder17@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Ông Văn Cả', '108 Hùng Vương, Quận 5, TP.HCM', '1996-09-27', 'bidder', 0.96, TRUE),
(29, 'bidder18@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Bà Thị Hàng', '109 Trần Phú, Quận 5, TP.HCM', '1995-11-10', 'bidder', 0.62, TRUE),
(30, 'bidder19@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Cô Văn Chọn', '110 An Dương Vương, Quận 5, TP.HCM', '1994-01-23', 'bidder', 0.98, TRUE),
(31, 'bidder20@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Chú Thị Lựa', '111 Lạc Long Quân, Quận 11, TP.HCM', '1993-03-08', 'bidder', 0.60, TRUE),
(32, 'bidder21@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Dì Văn Xem', '112 Âu Cơ, Quận Tân Bình, TP.HCM', '1997-05-21', 'bidder', 1.0, TRUE),
(33, 'bidder22@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Cậu Thị Đặt', '113 Trường Chinh, Quận Tân Bình, TP.HCM', '1992-07-04', 'bidder', 0.58, TRUE),
(34, 'bidder23@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Mợ Văn Ký', '114 Hòa Bình, Quận Tân Phú, TP.HCM', '1998-09-17', 'bidder', 0.82, TRUE),
(35, 'bidder24@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Anh Thị Giao', '115 Lũy Bán Bích, Quận Tân Phú, TP.HCM', '1991-11-30', 'bidder', 0.56, TRUE),
(36, 'bidder25@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Chị Văn Dịch', '116 Tân Sơn Nhì, Quận Tân Phú, TP.HCM', '1996-02-13', 'bidder', 0.84, TRUE),
(37, 'bidder26@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Em Thị Duyệt', '117 Phan Huy Ích, Quận Tân Bình, TP.HCM', '1995-04-26', 'bidder', 0.54, TRUE),
(38, 'bidder27@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Gia Văn Hợp', '118 Bạch Đằng, Quận Bình Thạnh, TP.HCM', '1994-06-09', 'bidder', 0.86, TRUE),
(39, 'bidder28@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Nhà Thị Đồng', '119 Xô Viết Nghệ Tĩnh, Quận Bình Thạnh, TP.HCM', '1993-08-22', 'bidder', 0.52, TRUE),
(40, 'bidder29@auction.com', '$2b$10$rKQ0z5qF5xJ3vL8Z9xqE1eCqY3vZ5xJ3vL8Z9xqE1eCqY3vZ5xJ3vO', 'Người Văn Thương', '120 Ung Văn Khiêm, Quận Bình Thạnh, TP.HCM', '1997-10-05', 'bidder', 0.88, TRUE);

-- Reset auto increment (optional, in case you want to add more users later)


SET FOREIGN_KEY_CHECKS = 0;

-- Insert the categories data
INSERT INTO categories (category_id, category_name, parent_id) VALUES
(1, 'Thiết bị điện tử', NULL),
(2, 'Sản phẩm thời trang', NULL),
(3, 'Thiết bị âm thanh', NULL),
(4, 'Phương tiện giao thông', NULL),
(5, '', NULL),
(6, 'Quần áo', 2),
(7, 'Giày dép', 2),
(8, 'Đồng hồ', 2),
(9, 'Chuột', 1),
(10, 'Điện thoại', 1),
(11, 'Laptop', 1),
(12, 'Bàn phím cơ', 1),
(13, 'Tai nghe bluetooth', 3),
(14, 'Loa bluetooth', 3),
(15, 'Loa kéo', 3),
(16, 'Micro', 3),
(17, 'Xe máy', 4),
(18, 'Xe hơi', 4);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('iPhone 17 Pro Max 256GB', 10, 4, NULL, 20000000, NULL, 50000000, 200000, '2025-11-21 19:41:19', '2025-12-12 19:41:19', 'expired', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('iPhone 17 Pro Max 512GB', 10, 4, NULL, 30000000, NULL, 75000000, 200000, '2025-11-21 19:41:19', '2025-12-13 19:41:19', 'expired', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('iPhone 17 Pro Max 1TB', 10, 4, NULL, 35000000, NULL, 87500000, 200000, '2025-11-21 19:41:19', '2025-12-14 19:41:19', 'expired', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('iPhone 17 Pro Max 2TB', 10, 4, NULL, 40000000, NULL, 100000000, 200000, '2025-11-22 19:41:19', '2025-12-15 19:41:19', 'expired', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Nokia 1280', 10, 4, NULL, 500000, NULL, 1250000, 50000, '2025-11-22 19:41:19', '2025-12-16 19:41:19', 'expired', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Vertu Signature V Gold Diamond Alligator', 10, 4, NULL, 3000000000, NULL, 7500000000, 10000000, '2025-11-22 19:41:19', '2025-12-17 19:41:19', 'expired', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Nike Mercurial Vapor 15 Academy', 7, 4, NULL, 1500000, NULL, 3750000, 100000, '2025-11-23 19:41:19', '2025-12-18 19:41:19', 'expired', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Nike Mercurial Vapor 15 Elite', 7, 4, 35, 5000000, 5300000, 12500000, 100000, '2025-11-24 19:41:19', '2025-12-19 19:41:19', 'sold', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Nike Mercurial Vapor 16 Elite', 7, 5, 35, 2500000, 2800000, 6250000, 100000, '2025-11-25 19:41:19', '2025-12-20 19:41:19', 'sold', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Nike Mercurial Vapor 16 Academy', 7, 5, 35, 7000000, 7300000, 17500000, 100000, '2025-11-26 19:41:19', '2025-12-21 19:41:19', 'sold', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Wika Toni Kroos', 7, 5, 36, 200000, 260000, 500000, 20000, '2025-11-27 19:41:19', '2025-12-22 19:41:19', 'sold', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Jersey Real Madrid sân nhà', 6, 5, 36, 3000000, 3600000, 7500000, 200000, '2025-11-28 19:41:19', '2025-12-23 19:41:19', 'sold', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Jersey Real Madrid sân khách', 6, 5, 36, 3000000, 3600000, 7500000, 200000, '2025-11-29 19:41:19', '2025-12-24 19:41:19', 'sold', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Jersey Mancherster United sân nhà', 6, 5, 35, 3000000, 3600000, 7500000, 200000, '2025-11-30 19:41:19', '2025-12-25 19:41:19', 'sold', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Jersey Mancherster United sân khách', 6, 5, NULL, 3000000, NULL, 7500000, 200000, '2026-01-07 19:41:19', '2025-12-26 19:41:19', 'sold', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Jersey Mancherster City sân khách', 6, 5, NULL, 3000000, NULL, 7500000, 200000, '2026-01-08 19:41:19', '2025-12-27 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Jersey Mancherster City sân nhà', 6, 5, NULL, 3000000, NULL, 7500000, 200000, '2026-01-09 19:41:19', '2025-12-28 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Jersey Bayern Munich sân khách', 6, 5, NULL, 3000000, NULL, 7500000, 200000, '2026-01-10 19:41:19', '2025-12-29 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Jersey Bayern Munich sân nhà', 6, 5, NULL, 3000000, NULL, 7500000, 200000, '2026-01-11 19:41:19', '2025-12-30 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Jersey PSG sân khách', 6, 5, NULL, 3000000, NULL, 7500000, 200000, '2026-01-12 19:41:19', '2025-12-31 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Jersey PSG sân nhà', 6, 5, NULL, 3000000, NULL, 7500000, 200000, '2026-01-13 19:41:19', '2026-01-01 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Rolex Land-Dweller', 8, 5, NULL, 850000000, NULL, 2125000000, 20000000, '2026-01-14 19:41:19', '2026-01-02 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Rolex Sky-Dweller', 8, 5, NULL, 1200000000, NULL, 3000000000, 20000000, '2026-01-15 19:41:19', '2026-01-03 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Curnon Kashmir Rise', 8, 5, NULL, 2000000, NULL, 5000000, 150000, '2026-01-16 19:41:19', '2026-01-04 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Curnon Kashmir Sharp', 8, 6, NULL, 2200000, NULL, 5500000, 150000, '2026-01-17 19:41:19', '2026-01-05 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Curnon Kashmir Calm', 8, 6, NULL, 2400000, NULL, 6000000, 150000, '2026-01-18 19:41:19', '2026-01-06 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Attack Shark X11', 9, 6, NULL, 550000, NULL, 1375000, 50000, '2026-01-19 19:41:19', '2026-01-07 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Logitech G502 X Plus Lightspeed', 9, 6, NULL, 5000000, NULL, 12500000, 50000, '2026-01-20 19:41:19', '2026-01-08 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Logitech Lift Vertical', 9, 6, NULL, 4500000, NULL, 11250000, 50000, '2026-01-21 19:41:19', '2026-01-09 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Laptop ASUS ROG Flow Z13 ', 11, 6, NULL, 50000000, NULL, 125000000, 1000000, '2026-01-22 19:41:19', '2026-01-10 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Laptop ASUS ROG Zephyrus G14 ', 11, 6, NULL, 60000000, NULL, 150000000, 1000000, '2026-01-23 19:41:19', '2026-01-11 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Laptop Lenovo Legion Pro 5', 11, 6, NULL, 45000000, NULL, 112500000, 1000000, '2026-01-24 19:41:19', '2026-01-12 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Laptop Dell Alienware M16', 11, 6, NULL, 65000000, NULL, 162500000, 1000000, '2026-01-25 19:41:19', '2026-01-13 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('MacBook Pro 14 M4 Pro', 11, 6, NULL, 40000000, NULL, 100000000, 1000000, '2026-01-26 19:41:19', '2026-01-14 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Bàn phím ASUS ROG Azoth Extreme', 12, 6, NULL, 5000000, NULL, 12500000, 1000000, '2026-01-27 19:41:19', '2026-01-15 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Bàn phím Machenike KT84-B84W', 12, 6, NULL, 3000000, NULL, 7500000, 150000, '2026-01-28 19:41:19', '2026-01-16 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Bàn phím Razer BlackWidow V4', 12, 6, NULL, 3200000, NULL, 8000000, 150000, '2026-01-29 19:41:19', '2026-01-17 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Apple AirPods Pro 2022', 13, 6, NULL, 1000000, NULL, 2500000, 150000, '2026-01-30 19:41:19', '2026-01-18 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Powerbeats Pro 2', 13, 6, NULL, 2000000, NULL, 5000000, 150000, '2026-01-31 19:41:19', '2026-01-19 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Edifier W820NB', 13, 6, NULL, 1500000, NULL, 3750000, 150000, '2026-02-01 19:41:19', '2026-01-20 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('JBL Charge 6', 14, 6, NULL, 3000000, NULL, 7500000, 150000, '2026-02-02 19:41:19', '2026-01-21 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('JBL Flip 6', 14, 6, NULL, 3500000, NULL, 8750000, 150000, '2026-02-03 19:41:19', '2026-01-22 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Marshall Acton III', 14, 6, NULL, 7750000, NULL, 19375000, 150000, '2026-02-04 19:41:19', '2026-01-23 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('SR-MV2000', 16, 6, NULL, 1350000, NULL, 3375000, 150000, '2026-02-05 19:41:19', '2026-01-24 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('SR-SmartMic Xmic Z4', 16, 6, NULL, 1550000, NULL, 3875000, 150000, '2026-02-06 19:41:19', '2026-01-25 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Alokio AL-VIP98', 15, 6, NULL, 12000000, NULL, 30000000, 150000, '2026-02-07 19:41:19', '2026-01-26 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Alokio AL-MX71', 15, 6, NULL, 15000000, NULL, 37500000, 150000, '2026-02-08 19:41:19', '2026-01-27 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('HONDA WINNER X', 17, 6, NULL, 50000000, NULL, 125000000, 1000000, '2026-02-09 19:41:19', '2026-01-28 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('YAMAHA Exciter 155 VVA', 17, 6, NULL, 45000000, NULL, 112500000, 1000000, '2026-02-10 19:41:19', '2026-01-29 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('YAMAHA PG-1', 17, 6, NULL, 35000000, NULL, 87500000, 1000000, '2026-02-11 19:41:19', '2026-01-30 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('VESPA SPRINT S 150', 17, 6, NULL, 100000000, NULL, 250000000, 2000000, '2026-02-12 19:41:19', '2026-01-31 19:41:19', 'active', 1, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Lamborghini Aventador', 18, 6, 30, 60000000000, 61500000000, 150000000000, 300000000, '2026-02-13 19:41:19', '2026-02-01 19:41:19', 'active', 0, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Lamborghini Huracan', 18, 6, 30, 7500000000, 8500000000, 18750000000, 200000000, '2026-02-14 19:41:19', '2026-02-02 19:41:19', 'active', 0, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Bugatti Chiron', 18, 6, 30, 70000000000, 73000000000, 175000000000, 300000000, '2026-02-15 19:41:19', '2026-02-03 19:41:19', 'active', 0, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Porsche 911 Carrera', 18, 6, 30, 7110000000, 7210000000, 17775000000, 20000000, '2026-02-16 19:41:19', '2026-02-04 19:41:19', 'active', 0, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Porsche 718 Cayman', 18, 6, 30, 4000000000, 4100000000, 10000000000, 20000000, '2026-02-17 19:41:19', '2026-02-05 19:41:19', 'active', 0, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Porsche Panamera GTS', 18, 6, 30, 10000000000, 11500000000, 25000000000, 300000000, '2026-02-18 19:41:19', '2026-02-06 19:41:19', 'active', 0, 1);
INSERT INTO products (product_name, category_id, seller_id, winner_id, start_value, current_price, buy_now_value, price_step, start_time, end_time, status, permission, auto_renewal)
VALUES ('Mercedes-Maybach S-Class', 18, 6, 30, 15000000000, 15500000000, 37500000000, 100000000, '2026-02-19 19:41:19', '2026-02-07 19:41:19', 'active', 0, 1);

-- Verification query to check row count
SELECT COUNT(*) as total_products FROM products;

-- MySQL Import Script for Auction Bids Data
-- Created: 2025-12-26

-- Drop table if exists (optional - comment out if you want to preserve existing data)

-- Create the auction_bids table

-- Insert the auction bid data
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (8, 30, 5100000, '2025-11-24 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (8, 31, 5200000, '2025-11-25 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (8, 29, 5300000, '2025-11-26 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (9, 28, 2600000, '2025-11-24 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (9, 25, 2700000, '2025-11-25 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (9, 30, 2800000, '2025-11-26 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (10, 31, 7100000, '2025-11-24 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (10, 29, 7200000, '2025-11-25 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (10, 28, 7300000, '2025-11-26 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (11, 25, 220000, '2025-11-24 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (11, 30, 240000, '2025-11-25 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (11, 31, 260000, '2025-11-26 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (12, 29, 3200000, '2025-11-24 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (12, 28, 3400000, '2025-11-25 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (12, 25, 3600000, '2025-11-26 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (13, 30, 3200000, '2025-11-24 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (13, 31, 3400000, '2025-11-25 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (13, 29, 3600000, '2025-11-26 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (14, 28, 3200000, '2025-11-24 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (14, 25, 3400000, '2025-11-25 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (14, 30, 3600000, '2025-11-26 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (52, 31, 60300000000, '2025-11-24 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (52, 29, 60600000000, '2025-11-25 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (52, 28, 60900000000, '2025-11-26 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (52, 25, 61200000000, '2025-11-27 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (52, 30, 61500000000, '2025-11-28 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (53, 31, 7700000000, '2025-11-24 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (53, 29, 7900000000, '2025-11-25 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (53, 28, 8100000000, '2025-11-26 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (53, 25, 8300000000, '2025-11-27 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (53, 30, 8500000000, '2025-11-28 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (54, 31, 70300000000, '2025-11-28 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (54, 29, 70600000000, '2025-11-28 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (54, 28, 70900000000, '2025-11-28 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (54, 25, 71200000000, '2025-11-28 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (54, 30, 71500000000, '2025-11-29 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (54, 31, 71800000000, '2025-11-30 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (54, 29, 72100000000, '2025-12-01 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (54, 28, 72400000000, '2025-12-02 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (54, 25, 72700000000, '2025-12-03 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (54, 30, 73000000000, '2025-12-04 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (55, 31, 7130000000, '2025-12-05 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (55, 29, 7150000000, '2025-12-06 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (55, 28, 7170000000, '2025-12-07 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (55, 25, 7190000000, '2025-12-08 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (55, 30, 7210000000, '2025-12-09 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (56, 31, 4020000000, '2025-12-10 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (56, 29, 4040000000, '2025-12-11 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (56, 28, 4060000000, '2025-12-12 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (56, 25, 4080000000, '2025-12-13 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (56, 30, 4100000000, '2025-12-14 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (57, 31, 10300000000, '2025-12-15 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (57, 29, 10600000000, '2025-12-16 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (57, 28, 10900000000, '2025-12-17 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (57, 25, 11200000000, '2025-12-18 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (57, 30, 11500000000, '2025-12-19 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (58, 31, 15100000000, '2025-12-20 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (58, 29, 15200000000, '2025-12-21 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (58, 28, 15300000000, '2025-12-22 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (58, 25, 15400000000, '2025-12-23 19:41:19', 0);
INSERT INTO bids (product_id, bidder_id, amount, bid_time, status)
VALUES (58, 30, 15500000000, '2025-12-24 19:41:19', 0);

-- Verification query to check row count

INSERT INTO productdescriptions (product_id, description, created_at) VALUES
(1, 'Máy đẹp, pin 99%', '2025-12-15 19:41:19'),
(2, 'Máy đẹp, pin 99%', '2025-12-15 19:41:19'),
(3, 'Máy đẹp, pin 99%', '2025-12-15 19:41:19'),
(4, 'Máy đẹp, pin 99%', '2025-12-15 19:41:19'),
(5, 'Nghe gọi đập chọi tốt', '2025-12-15 19:41:19'),
(6, 'Sang chảnh, đẳng cấp', '2025-12-15 19:41:19'),
(7, 'Giày ôm chân, đinh còn mới', '2025-12-15 19:41:19'),
(8, 'Giày ôm chân, đinh còn mới', '2025-12-15 19:41:19'),
(9, 'Giày ôm chân, đinh còn mới', '2025-12-15 19:41:19'),
(10, 'Giày ôm chân, đinh còn mới', '2025-12-15 19:41:19'),
(11, 'Huyền thoại đỉnh cao', '2025-12-15 19:41:19'),
(12, 'Khí chất nhà vua', '2025-12-15 19:41:19'),
(13, 'Khí chất nhà vua', '2025-12-15 19:41:19'),
(14, 'Mân Đàn muôn năm', '2025-12-15 19:41:19'),
(15, 'Mân Đàn muôn năm', '2025-12-15 19:41:19'),
(16, 'Manchester is blue', '2025-12-15 19:41:19'),
(17, 'Manchester is blue', '2025-12-15 19:41:19'),
(18, 'Mia san mia', '2025-12-15 19:41:19'),
(19, 'Mia san mia', '2025-12-15 19:41:19'),
(20, 'Paris est magique', '2025-12-15 19:41:19'),
(21, 'Paris est magique', '2025-12-15 19:41:19'),
(22, 'Vuýp', '2025-12-15 19:41:19'),
(23, 'Vuýp', '2025-12-15 19:41:19'),
(24, 'Vuýp VN', '2025-12-15 19:41:19'),
(25, 'Vuýp VN', '2025-12-15 19:41:19'),
(26, 'Vuýp VN', '2025-12-15 19:41:19'),
(27, 'Chuột nhạy, chơi game tốt', '2025-12-15 19:41:19'),
(28, 'Chuột nhạy, chơi game tốt', '2025-12-15 19:41:19'),
(29, 'Chuột nhạy, chơi game tốt', '2025-12-15 19:41:19'),
(30, 'Máy khỏe, RAM to, màn đẹp', '2025-12-15 19:41:19'),
(31, 'Máy khỏe, RAM to, màn đẹp', '2025-12-15 19:41:19'),
(32, 'Máy khỏe, RAM to, màn đẹp', '2025-12-15 19:41:19'),
(33, 'Máy khỏe, RAM to, màn đẹp', '2025-12-15 19:41:19'),
(34, 'Gọn nhẹ, màn đẹp', '2025-12-15 19:41:19'),
(35, 'Bàn phím siêu khê', '2025-12-15 19:41:19'),
(36, 'Bàn phím siêu khê', '2025-12-15 19:41:19'),
(37, 'Bàn phím siêu khê', '2025-12-15 19:41:19'),
(38, 'Tai nghe sang chảnh', '2025-12-15 19:41:19'),
(39, 'Chất âm tốt, bass mạnh', '2025-12-15 19:41:19'),
(40, 'Chất âm tốt, bass mạnh', '2025-12-15 19:41:19'),
(41, 'Chất âm tốt, bass mạnh', '2025-12-15 19:41:19'),
(42, 'Chất âm tốt, bass mạnh', '2025-12-15 19:41:19'),
(43, 'Chất âm tốt, bass mạnh', '2025-12-15 19:41:19'),
(44, 'Chất âm tốt, bass mạnh', '2025-12-15 19:41:19'),
(45, 'Chất âm tốt, bass mạnh', '2025-12-15 19:41:19'),
(46, 'Chất âm tốt, bass mạnh', '2025-12-15 19:41:19'),
(47, 'Chất âm tốt, bass mạnh', '2025-12-15 19:41:19'),
(48, 'Xe đẹp máy khỏe', '2025-12-15 19:41:19'),
(49, 'Xe đẹp máy khỏe', '2025-12-15 19:41:19'),
(50, 'Xe đẹp máy khỏe', '2025-12-15 19:41:19'),
(51, 'Xe sang chảnh', '2025-12-15 19:41:19'),
(52, 'Đỉnh của chóp', '2025-12-15 19:41:19'),
(53, 'Đỉnh của chóp', '2025-12-15 19:41:19'),
(54, 'Đỉnh của chóp', '2025-12-15 19:41:19'),
(55, 'Đỉnh của chóp', '2025-12-15 19:41:19'),
(56, 'Đỉnh của chóp', '2025-12-15 19:41:19'),
(57, 'Đỉnh của chóp', '2025-12-15 19:41:19'),
(58, 'Đỉnh của chóp', '2025-12-15 19:41:19');

INSERT INTO productimages (product_id, img_url)
VALUES (1, 'https://i.postimg.cc/pX4QYbpn/28889798.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (1, 'https://i.postimg.cc/3JVjC5dm/96639-image001-16140026.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (1, 'https://i.postimg.cc/pX4QYbp9/iphone-17-pro-max-mau-xanh-dam.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (2, 'https://i.postimg.cc/pX4QYbpn/28889798.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (2, 'https://i.postimg.cc/3JVjC5dm/96639-image001-16140026.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (2, 'https://i.postimg.cc/pX4QYbp9/iphone-17-pro-max-mau-xanh-dam.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (3, 'https://i.postimg.cc/pX4QYbpn/28889798.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (3, 'https://i.postimg.cc/3JVjC5dm/96639-image001-16140026.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (3, 'https://i.postimg.cc/pX4QYbp9/iphone-17-pro-max-mau-xanh-dam.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (4, 'https://i.postimg.cc/pX4QYbpn/28889798.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (4, 'https://i.postimg.cc/3JVjC5dm/96639-image001-16140026.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (4, 'https://i.postimg.cc/pX4QYbp9/iphone-17-pro-max-mau-xanh-dam.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (5, 'https://i.postimg.cc/Kvw7rSR1/dien-thoai-di-dong-Nokia-1280-dienmay-com-l.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (5, 'https://i.postimg.cc/DyHQdk8Z/dien-thoai-nokia-1280-2tekvn-net-2.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (5, 'https://i.postimg.cc/7Yd1M8fP/nokia-1280-clip-image001.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (6, 'https://i.postimg.cc/ncgKYbCL/vertu-signature-s-black-gold-ink-jade-black-calf-2-954543f6629c4541ae5b6fc0b98f7c62-grande.png');
INSERT INTO productimages (product_id, img_url)
VALUES (6, 'https://i.postimg.cc/28VFZ881/vertu-signature-v-black-gold-diamond-iron-black-alligator-jpeg.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (6, 'https://i.postimg.cc/qMScXVzv/vertu-signature-v-gold-diamond-alligator-a48804798b864022ad18a4f338ef9716-grande.png');
INSERT INTO productimages (product_id, img_url)
VALUES (7, 'https://i.postimg.cc/Fs7gLssz/Giay-Nike-Mercurial-Vapor-15-Academy-TF-Racer-Pink-DJ5633-601.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (7, 'https://i.postimg.cc/8PjB6PPj/images.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (7, 'https://i.postimg.cc/J4Gck44y/anh-sp-add-01-01-01-04-07173-2-526bc45cf92a41dd89211b8389572379-1024x1024.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (8, 'https://i.postimg.cc/VLdBCLLf/Giay-Nike-Mercurial-Vapor-15-Elite-FG-Pink-Foam-Black-DJ4978-601.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (8, 'https://i.postimg.cc/ncCYDccp/57.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (8, 'https://i.postimg.cc/KvRrMvvh/iii.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (9, 'https://i.postimg.cc/9Frt7FFh/qii.avif');
INSERT INTO productimages (product_id, img_url)
VALUES (9, 'https://i.postimg.cc/YqhfWqq7/dldl.avif');
INSERT INTO productimages (product_id, img_url)
VALUES (9, 'https://i.postimg.cc/HsV4ysWq/hhhg.avif');
INSERT INTO productimages (product_id, img_url)
VALUES (10, 'https://i.postimg.cc/rFKCrFyZ/hmf.avif');
INSERT INTO productimages (product_id, img_url)
VALUES (10, 'https://i.postimg.cc/VLdBCLsV/lll.avif');
INSERT INTO productimages (product_id, img_url)
VALUES (10, 'https://i.postimg.cc/RVNQHVC8/vp.avif');
INSERT INTO productimages (product_id, img_url)
VALUES (11, 'https://i.postimg.cc/448QyhZk/giay-wika-toni-kroos-xanh.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (11, 'https://i.postimg.cc/tRrNJVb8/giay-wika-toni-kroos-xanh-2.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (11, 'https://i.postimg.cc/mZdykFRx/vn-11134207-7r98o-ln6wihz98xjs16-b452fd1d00e04dec86a087c51dd0917e.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (12, 'https://i.postimg.cc/bY69r2P9/mog.avif');
INSERT INTO productimages (product_id, img_url)
VALUES (12, 'https://i.postimg.cc/HWS9n7mS/rm1.avif');
INSERT INTO productimages (product_id, img_url)
VALUES (12, 'https://i.postimg.cc/DfCP0bhj/ao-djau-san-nha-authentic-real-madrid-24-25-trang-ix8095-hm6-2173f6f326c24436b66c7c5a6ee8e755-grande.png');
INSERT INTO productimages (product_id, img_url)
VALUES (13, 'https://i.postimg.cc/jq842JTZ/ee.avif');
INSERT INTO productimages (product_id, img_url)
VALUES (13, 'https://i.postimg.cc/v8PtT6yX/mmf.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (13, 'https://i.postimg.cc/bY69r2P9/mog.avif');
INSERT INTO productimages (product_id, img_url)
VALUES (14, 'https://i.postimg.cc/h4C1v7n8/mmff.avif');
INSERT INTO productimages (product_id, img_url)
VALUES (14, 'https://i.postimg.cc/Vs7WvbwB/mu.avif');
INSERT INTO productimages (product_id, img_url)
VALUES (14, 'https://i.postimg.cc/59PSyFJC/manchester-united-24-25-home-kit-design-leaked-v0-uugu3vhy7t0d1.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (15, 'https://i.postimg.cc/x8Fv4BgC/mmd.avif');
INSERT INTO productimages (product_id, img_url)
VALUES (15, 'https://i.postimg.cc/1XYGjbM5/download.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (15, 'https://i.postimg.cc/3NbXcz9Y/fdsf.avif');
INSERT INTO productimages (product_id, img_url)
VALUES (16, 'https://i.postimg.cc/VvHqV2gT/sssss.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (16, 'https://i.postimg.cc/hv3L5NMK/26-Nam.avif');
INSERT INTO productimages (product_id, img_url)
VALUES (16, 'https://i.postimg.cc/J0dN2SxF/asdasd.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (17, 'https://i.postimg.cc/rsY1P7g8/asss.avif');
INSERT INTO productimages (product_id, img_url)
VALUES (17, 'https://i.postimg.cc/vTSrNCXF/sfs.avif');
INSERT INTO productimages (product_id, img_url)
VALUES (17, 'https://i.postimg.cc/5ykBRDp2/26-Replica-Manchester-City-Nam.avif');
INSERT INTO productimages (product_id, img_url)
VALUES (18, 'https://i.postimg.cc/2yXQKgGX/sss.avif');
INSERT INTO productimages (product_id, img_url)
VALUES (18, 'https://i.postimg.cc/8cnR0x44/opo.avif');
INSERT INTO productimages (product_id, img_url)
VALUES (18, 'https://i.postimg.cc/sx0YNbmN/rfs.avif');
INSERT INTO productimages (product_id, img_url)
VALUES (19, 'https://i.postimg.cc/T1PjQTVs/s-l1200.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (19, 'https://i.postimg.cc/qqZs5WwG/sdd.avif');
INSERT INTO productimages (product_id, img_url)
VALUES (19, 'https://i.postimg.cc/J0dN2Sxq/mg-4984-8c257ac8e5e44c7fb9e7d73dcf6e379f-1024x1024.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (20, 'https://i.postimg.cc/Bbv5NJTM/FN8781-101-1-1200x1200.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (20, 'https://i.postimg.cc/HnL03TwZ/quan-ao-bong-da-psg-san-khach-25-26-mau-trang-hido-sport.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (20, 'https://i.postimg.cc/prdQkPf1/Ao-psg-san-khach-2023-1.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (21, 'https://i.postimg.cc/prdQkPf1/Ao-psg-san-khach-2023-1.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (21, 'https://i.postimg.cc/Y0SN8t68/2-0af779211eca4e18b6d4bc9c5959bb25.png');
INSERT INTO productimages (product_id, img_url)
VALUES (21, 'https://i.postimg.cc/3Nwj93XB/Ao-bong-da-psg-san-nha-2526-1.png');
INSERT INTO productimages (product_id, img_url)
VALUES (22, 'https://i.postimg.cc/j2j6vRHh/m127334-0001.avif');
INSERT INTO productimages (product_id, img_url)
VALUES (22, 'https://i.postimg.cc/HnL03Tww/rg(29).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (22, 'https://i.postimg.cc/prdQkPfY/rolex-the-land-dweller-yuja-wang-ywang-potrait.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (23, 'https://i.postimg.cc/GtpPzbFD/m336934-0005.avif');
INSERT INTO productimages (product_id, img_url)
VALUES (23, 'https://i.postimg.cc/SRKLVm6X/Rolex-Sky-Dweller-15.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (23, 'https://i.postimg.cc/QCMgSjQg/Rolex-Sky-Dweller-326934-Pic-6.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (24, 'https://i.postimg.cc/63cLd8vv/ANN-8626-e1708398277706.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (24, 'https://i.postimg.cc/mDjNQPHz/kashmir-banner1-e1708398488851.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (24, 'https://i.postimg.cc/k4sFx2b2/NDP5195-e1708398570382.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (25, 'https://i.postimg.cc/xC5yKXzc/BR-Sharp-2345353.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (25, 'https://i.postimg.cc/nz2YvXDh/Sharp-3.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (25, 'https://i.postimg.cc/vBhLW4V1/Sharp-Tha-ng12351235.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (26, 'https://i.postimg.cc/Jnxcbsk4/BT-Calm-1676855.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (26, 'https://i.postimg.cc/26GF41Zk/Calm-246445343.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (26, 'https://i.postimg.cc/XJLcwrCN/Curnonlst18273-copy-e1708576927927.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (27, 'https://i.postimg.cc/B6pcxjKG/2-336c56a1-4add-4b45-ad5d-03b077d0e1cd.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (27, 'https://i.postimg.cc/ydjXFDSt/3-1e67c7ce-c7a9-4048-ab0f-c0be06bc9cb1.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (27, 'https://i.postimg.cc/tTkthsxy/3-5903f8ba-cd09-4b98-9443-1e2a658243d1.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (28, 'https://i.postimg.cc/ZR4xB8CJ/chuot-gaming-khong-day-logitech-g502-x-plus-lightspeed-1.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (28, 'https://i.postimg.cc/hjc1zLfc/chuot-gaming-khong-day-logitech-g502-x-plus-lightspeed-2.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (28, 'https://i.postimg.cc/rmMN01Kc/chuot-gaming-khong-day-logitech-g502-x-plus-lightspeed-3.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (29, 'https://i.postimg.cc/B64BLTXW/10-9-61.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (29, 'https://i.postimg.cc/TwfJLVhz/11-6-33.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (29, 'https://i.postimg.cc/sXs4QY1t/12-5-85.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (30, 'https://i.postimg.cc/NMBk96LJ/text-ng-n-4-7-201.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (30, 'https://i.postimg.cc/qR4xhsgx/text-ng-n-5-9-205.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (30, 'https://i.postimg.cc/Sskf26jV/text-ng-n-7-4-160.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (31, 'https://i.postimg.cc/NMBk96LJ/text-ng-n-4-7-201.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (31, 'https://i.postimg.cc/qR4xhsgx/text-ng-n-5-9-205.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (31, 'https://i.postimg.cc/Sskf26jV/text-ng-n-7-4-160.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (32, 'https://i.postimg.cc/vBbtgrDL/text-ng-n-3-7-186.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (32, 'https://i.postimg.cc/ydsygmWT/text-ng-n-4-7-234.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (32, 'https://i.postimg.cc/63tf2rTV/text-ng-n-8-6-187.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (33, 'https://i.postimg.cc/BvxCnYZp/laptop-dell-alienware-m16-3.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (33, 'https://i.postimg.cc/nLv1hRVk/laptop-dell-alienware-m16-4.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (33, 'https://i.postimg.cc/VNjFkGs7/laptop-dell-alienware-m162.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (34, 'https://i.postimg.cc/LszV8C4k/macbook-pro-14-inch-m4-pro-or-max-chip-silver-pdp-image-position-2-7.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (34, 'https://i.postimg.cc/MGyYpPZy/macbook-pro-16-inch-m4-pro-or-max-chip-silver-pdp-image-position-7-7.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (34, 'https://i.postimg.cc/PqmM53fQ/text-ng-n-1-6-138-6.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (35, 'https://i.postimg.cc/d089VHQC/ban-phim-gaming-asus-rog-azoth-extreme-den-1.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (35, 'https://i.postimg.cc/MGyYpPZj/ban-phim-gaming-asus-rog-azoth-extreme-den-3-1.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (35, 'https://i.postimg.cc/SKWGxTQs/ban-phim-gaming-asus-rog-azoth-extreme-den-4-1.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (36, 'https://i.postimg.cc/g09DdFpx/Machenike-KT84-B84W-Smart-Screen-Tri-mode-White.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (36, 'https://i.postimg.cc/9fGBQ8X7/white-1-f085dcafd386443dbbe5e6303ac8b74e-master.png');
INSERT INTO productimages (product_id, img_url)
VALUES (36, 'https://i.postimg.cc/k5xyg1MF/white-2-eda5e12d1dbb4b699c4dcb0b5e294f9a-master.png');
INSERT INTO productimages (product_id, img_url)
VALUES (37, 'https://i.postimg.cc/d0MBvPFD/2-f69a2d419371436083b3a5521ebec66c-master.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (37, 'https://i.postimg.cc/FKtZm5v9/z4571450737160-2334de0074ebbfea277f8780519c46ac-568141b69a044b55bd1bf078f86a27a6-master.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (37, 'https://i.postimg.cc/JhwqmV8L/z4571453724049-38fee4cd392684bac3f5f2c9f131aaf8-7156f22659e0426cb913402d7ca960ed-master.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (38, 'https://i.postimg.cc/QMLbsGDZ/airpods-pro-3-600x600-97609cf56e73499f94f3b6bdd605cf82-c8aecc3428ce451da1dea465b866e65a-master.png');
INSERT INTO productimages (product_id, img_url)
VALUES (38, 'https://i.postimg.cc/3wMB75h5/airpods-pro-matte-white-color-a6f3150ab0a04ec39fb47011f6be6207-9dc08709e3544471a705ed58669aacb3-mast.jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (38, 'https://i.postimg.cc/1zxHPhSP/mwp22-c3552981274e43acaa2fa999645a1b18-a93e0fa0e0334e0e907bda97d5fd5c90-master.png');
INSERT INTO productimages (product_id, img_url)
VALUES (39, 'https://i.postimg.cc/fb4KZnNg/tai-nghe-bluetooth-powerbeat-pro-2025-12.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (39, 'https://i.postimg.cc/LsdTRKpG/tai-nghe-bluetooth-powerbeat-pro-2025-3.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (39, 'https://i.postimg.cc/JhwqmVL2/tai-nghe-bluetooth-powerbeat-pro-2025-7.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (40, 'https://i.postimg.cc/g09DdFWS/edifier-w820nb-1.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (40, 'https://i.postimg.cc/Dw4gtf9K/edifier-w820nb-6.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (40, 'https://i.postimg.cc/nh9k6V6y/edifier-w820nb-7.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (41, 'https://i.postimg.cc/13VHLRLL/jbl-charge-6-bl.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (41, 'https://i.postimg.cc/RZJRjCjb/jbl-charge-6-bl-2.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (41, 'https://i.postimg.cc/wjRVSxSG/jbl-charge-6-bl-3.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (42, 'https://i.postimg.cc/qv6L9B9c/jbl-flip-6-10.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (42, 'https://i.postimg.cc/bwSTKYK6/jbl-flip-6-11.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (42, 'https://i.postimg.cc/SxYrwQwV/jbl-flip-6-12.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (43, 'https://i.postimg.cc/T359Z2Zq/marshall-acton-iii-1.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (43, 'https://i.postimg.cc/MpfDhZhB/marshall-acton-iii-2.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (43, 'https://i.postimg.cc/t4n5LRLW/marshall-acton-iii-4.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (44, 'https://i.postimg.cc/SxYrwQwM/microphone-co-day-saramonic-sr-mv2000-1.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (44, 'https://i.postimg.cc/7YW9sJQM/microphone-co-day-saramonic-sr-mv2000-2.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (44, 'https://i.postimg.cc/c4bh9t5B/microphone-co-day-saramonic-sr-mv2000-3.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (45, 'https://i.postimg.cc/tCMkSnm6/microphone-co-day-saramonic-sr-smartmic-xmic-z4-1.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (45, 'https://i.postimg.cc/yYbjQ3rg/microphone-co-day-saramonic-sr-smartmic-xmic-z4-2.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (45, 'https://i.postimg.cc/pX6CG51K/microphone-co-day-saramonic-sr-smartmic-xmic-z4-4.webp');
INSERT INTO productimages (product_id, img_url)
VALUES (46, 'https://i.postimg.cc/vHNhqxS1/download-(1).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (46, 'https://i.postimg.cc/PrRy3vFP/download-(2).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (46, 'https://i.postimg.cc/L6bDCg06/images-(1).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (47, 'https://i.postimg.cc/8P04Kfn7/8531-loa-keo-alokio-al-mx71.png');
INSERT INTO productimages (product_id, img_url)
VALUES (47, 'https://i.postimg.cc/7YW9sJQH/download-(3).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (47, 'https://i.postimg.cc/TY4075Hx/download-(4).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (48, 'https://i.postimg.cc/Gh5K7TS1/download-(5).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (48, 'https://i.postimg.cc/jd5v44v2/download-(6).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (48, 'https://i.postimg.cc/SNsVffVq/download-(7).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (49, 'https://i.postimg.cc/bNJL99g4/download-(10).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (49, 'https://i.postimg.cc/tCTDNNDH/download-(8).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (49, 'https://i.postimg.cc/Yq98zz8K/download-(9).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (50, 'https://i.postimg.cc/xTCg335Z/download-(11).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (50, 'https://i.postimg.cc/CL1Jss7J/download-(12).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (50, 'https://i.postimg.cc/7Y6Xnn9m/download-(13).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (51, 'https://i.postimg.cc/sDXK44mm/download-(14).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (51, 'https://i.postimg.cc/wxF0NGXZ/download-(15).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (51, 'https://i.postimg.cc/44wBcS6F/download-(16).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (52, 'https://i.postimg.cc/59pnzRBK/download-(17).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (52, 'https://i.postimg.cc/3r9nGcXt/download-(18).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (52, 'https://i.postimg.cc/h4Mpm5LM/download-(19).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (53, 'https://i.postimg.cc/FFGDSByp/download-(20).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (53, 'https://i.postimg.cc/tRD26M35/download-(21).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (53, 'https://i.postimg.cc/kMwfSpQF/download-(22).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (54, 'https://i.postimg.cc/wxF0NGXy/download-(23).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (54, 'https://i.postimg.cc/wxF0NGXR/download-(24).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (54, 'https://i.postimg.cc/rygQ4P1d/download-(25).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (55, 'https://i.postimg.cc/qBQjK5sN/download-(26).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (55, 'https://i.postimg.cc/yxfjzD6s/download-(27).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (55, 'https://i.postimg.cc/2yHGf1jY/download-(28).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (56, 'https://i.postimg.cc/NFNDwKGQ/download-(29).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (56, 'https://i.postimg.cc/J0TxWs7m/download-(30).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (56, 'https://i.postimg.cc/rshjLDy6/download-(31).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (57, 'https://i.postimg.cc/NFNDwKGQ/download-(29).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (57, 'https://i.postimg.cc/J0TxWs7m/download-(30).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (57, 'https://i.postimg.cc/rshjLDy6/download-(31).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (58, 'https://i.postimg.cc/RhPdzWS1/download-(35).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (58, 'https://i.postimg.cc/2yHGf1kK/images-(2).jpg');
INSERT INTO productimages (product_id, img_url)
VALUES (58, 'https://i.postimg.cc/hvCsqXDY/images-(3).jpg');