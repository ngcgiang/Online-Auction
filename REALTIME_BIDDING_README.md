# 🚀 Socket.io Realtime Bidding System

## 📋 Tổng Quan

Hệ thống đấu giá realtime sử dụng Socket.io với kiến trúc phân chia rooms tối ưu băng thông:
- **Room `product_{id}`**: Dữ liệu đầy đủ cho trang chi tiết sản phẩm
- **Room `homepage_feed`**: Dữ liệu tối giản cho trang danh sách

---

## 📦 Cài Đặt

### 1. Install Dependencies

```bash
npm install socket.io
```

### 2. Cấu Trúc Files

```
src/
├── config/
│   └── socket.js              # Khởi tạo Socket.io server
├── services/
│   ├── bidService.js          # Logic đấu giá (đã tích hợp)
│   └── realtimeBidService.js  # Service emit Socket.io events
├── controllers/
│   └── bidController.js       # Controller đấu giá (đã tích hợp)
├── public/
│   ├── product-detail-client.html  # Client cho trang chi tiết
│   └── homepage-client.html        # Client cho trang chủ
└── server.js                  # Main server (đã tích hợp)
```

---

## 🔧 Server-Side Implementation

### ✅ Đã Hoàn Thành

1. **`config/socket.js`** - Socket.io initialization với các events:
   - `connection` - User kết nối
   - `join_product_room` - Join room chi tiết sản phẩm
   - `leave_product_room` - Leave room chi tiết
   - `join_homepage` - Join room trang chủ
   - `leave_homepage` - Leave room trang chủ
   - `disconnect` - User ngắt kết nối

2. **`services/realtimeBidService.js`** - Service xử lý Socket.io:
   - `maskUsername()` - Che nửa đầu username (vd: "john_doe" → "****_doe")
   - `emitProductDetailUpdate()` - Emit full data đến room `product_{id}`
   - `emitHomepageFeedUpdate()` - Emit minimal data đến room `homepage_feed`
   - `emitBidUpdate()` - Emit song song đến cả 2 rooms

3. **`controllers/bidController.js`** - Tích hợp vào API POST /api/bids:
   ```javascript
   // Sau khi lưu DB thành công, emit realtime (non-blocking)
   realtimeBidService.emitBidUpdate(productId, result).catch(error => {
     console.error('⚠️ Failed to emit realtime bid update:', error);
   });
   ```

4. **`server.js`** - Khởi tạo Socket.io với Express:
   ```javascript
   const server = http.createServer(app);
   const io = initializeSocket(server);
   realtimeBidService.setSocketIO(io);
   server.listen(PORT);
   ```

---

## 💻 Client-Side Implementation

### 1. Trang Chi Tiết Sản Phẩm (`product-detail-client.html`)

**Dữ liệu nhận được (Full Data):**
```javascript
{
  productId: 123,
  currentPrice: 5500000,
  winner: {
    userId: 45,
    username: '****_doe',  // Đã che nửa đầu
    ratingScore: 4.5
  },
  bidCount: 15,
  remainingTime: 600000,  // milliseconds
  endTime: '2025-11-26T10:00:00Z',
  timestamp: '2025-11-26T09:50:00Z'
}
```

**Event listener:**
```javascript
socket.on('update_price_detail', (data) => {
  if (data.productId === CURRENT_PRODUCT_ID) {
    updateProductDetail(data);
  }
});
```

**Features:**
- ✅ Hiển thị giá realtime với animation
- ✅ Thông tin người thắng (username đã mask, rating score)
- ✅ Countdown timer tự động cập nhật
- ✅ Số lượt đặt giá
- ✅ Highlight khi có update mới

### 2. Trang Chủ (`homepage-client.html`)

**Dữ liệu nhận được (Minimal Data):**
```javascript
{
  productId: 123,
  currentPrice: 5500000,
  winnerUsername: '****_doe',
  timestamp: '2025-11-26T09:50:00Z'
}
```

**Event listener với logic kiểm tra:**
```javascript
socket.on('update_price_list', (data) => {
  // ✅ CHỈ update nếu sản phẩm có trong danh sách hiện tại
  if (currentProducts[data.productId]) {
    updateProductInList(data);
  }
});
```

**Features:**
- ✅ Chỉ update sản phẩm đang hiển thị (tối ưu performance)
- ✅ Animation nhấp nháy khi có giá mới
- ✅ Badge "MỚI" xuất hiện 2 giây
- ✅ Log realtime updates (debugging)

---

## 🧪 Testing

### 1. Khởi động server

```bash
cd src
node server.js
```

Expected output:
```
🚀 Socket.io initialized successfully
Database connection established successfully.
Server is running on port 3000
```

### 2. Mở trình duyệt

**Tab 1 - Trang Chi Tiết:**
```
http://localhost:3000/product-detail-client.html
```

**Tab 2 - Trang Chủ:**
```
http://localhost:3000/homepage-client.html
```

**Tab 3 - API Test (Postman):**
```http
POST http://localhost:3000/api/bids
Content-Type: application/json

{
  "userId": 2,
  "productId": 123,
  "amount": 5500000
}
```

### 3. Kết quả mong đợi

1. ✅ Tab 1: Hiển thị giá mới + thông tin người thắng + countdown
2. ✅ Tab 2: Hiển thị giá mới với animation (nếu product #123 có trong list)
3. ✅ Console logs: `📡 Emitted to product_123` và `📡 Emitted to homepage_feed`

---

## 📊 Data Flow

```
User đặt giá
    ↓
POST /api/bids (bidController.placeBid)
    ↓
bidService.placeBid() → Lưu DB + Transaction
    ↓
✅ Success → realtimeBidService.emitBidUpdate()
    ↓
    ├─→ emitProductDetailUpdate() → room `product_123`
    │       ↓
    │   Client (Product Detail) nhận full data
    │
    └─→ emitHomepageFeedUpdate() → room `homepage_feed`
            ↓
        Client (Homepage) nhận minimal data
            ↓
        Kiểm tra: productId có trong list?
            ├─→ YES: Update giá + animation
            └─→ NO: Bỏ qua (tối ưu performance)
```

---

## 🔐 Security Notes

1. **CORS Configuration:**
   ```javascript
   // config/socket.js
   cors: {
     origin: '*'  // ⚠️ TODO: Thay bằng domain cụ thể trong production
   }
   ```

2. **Username Masking:**
   - Tự động che nửa đầu username
   - Ví dụ: "john_doe" → "****_doe"

3. **Room Isolation:**
   - Mỗi product có room riêng
   - Homepage có room chung
   - Không có cross-room data leakage

---

## 🎨 Customization

### Thay đổi CORS

```javascript
// config/socket.js
cors: {
  origin: ['https://yourdomain.com', 'https://admin.yourdomain.com'],
  methods: ['GET', 'POST']
}
```

### Thay đổi mask pattern

```javascript
// services/realtimeBidService.js
maskUsername(username) {
  // Che toàn bộ trừ 2 ký tự cuối
  const visiblePart = username.slice(-2);
  const maskedPart = '*'.repeat(username.length - 2);
  return maskedPart + visiblePart;
}
```

### Thêm authentication

```javascript
// config/socket.js
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (isValidToken(token)) {
    next();
  } else {
    next(new Error('Authentication error'));
  }
});
```

---

## 📈 Performance

### Băng thông tiết kiệm

- **Trang chi tiết:** ~500 bytes/update (full data)
- **Trang chủ:** ~100 bytes/update (minimal data)
- **Tiết kiệm:** 80% cho homepage traffic

### Scalability

- Socket.io hỗ trợ Redis adapter cho multiple servers
- Room-based architecture dễ scale horizontal

---

## 🐛 Troubleshooting

### Lỗi: "Socket.io not initialized"

**Nguyên nhân:** `realtimeBidService.setSocketIO()` chưa được gọi

**Giải pháp:** Kiểm tra `server.js` đã có:
```javascript
realtimeBidService.setSocketIO(io);
```

### Client không kết nối được

**Kiểm tra:**
1. Server đã khởi động? `node server.js`
2. Port 3000 có bị chặn?
3. CORS configuration đúng?
4. Socket.io client library đã load?

### Update không xuất hiện trên homepage

**Nguyên nhân:** ProductId không có trong `currentProducts`

**Giải pháp:** Kiểm tra logic:
```javascript
if (currentProducts[data.productId]) {
  updateProductInList(data);
}
```

---

## 📚 References

- [Socket.io Documentation](https://socket.io/docs/v4/)
- [Socket.io Rooms](https://socket.io/docs/v4/rooms/)
- [Express.js Integration](https://socket.io/docs/v4/server-installation/)

---

## ✅ Checklist

- [x] Socket.io server setup
- [x] Room management (product + homepage)
- [x] Realtime service layer
- [x] Controller integration (non-blocking)
- [x] Client code (product detail)
- [x] Client code (homepage with filtering)
- [x] Username masking
- [x] Remaining time calculation
- [x] Bid count tracking
- [x] Animation & UX effects

---

## 👨‍💻 Author

Senior Fullstack Developer (Node.js/Express + Socket.io)
