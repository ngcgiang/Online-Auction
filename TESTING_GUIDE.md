# 🧪 Testing Guide - Realtime Bidding System

## Prerequisites
- Database populated with sample products, users, categories
- Server running on `http://localhost:3000`
- At least one active product with `status = 'active'`

## 🚀 Quick Start Testing

### 1. Start the Server
```bash
cd src
node server.js
```

Expected output:
```
✅ Database connected successfully
🚀 Server running on port 3000
```

### 2. Test Homepage (List View)
1. Open browser: `http://localhost:3000/homepage`
2. Should display real products from database with:
   - Product images (if available)
   - Product names
   - Current prices
   - Winner username (masked)
   - "Xem chi tiết" button

**Check Console:**
- `📄 Page loaded, fetching initial data...`
- `✅ Rendered X products`
- `✅ Socket.io connected`
- `✅ Joined homepage feed`

### 3. Test Product Detail Page
1. Click any product "Xem chi tiết" button
2. URL should be: `http://localhost:3000/product/123` (where 123 is productId)
3. Should display:
   - Product name with ID
   - Current price
   - Winner info (username + rating score)
   - Bid count
   - Countdown timer (updating every second)
   - Connection status (green = connected)
   - Bid history list

**Check Console:**
- `📄 Page loaded, loading product details...`
- `✅ Product details loaded`
- `✅ Socket.io connected`
- `✅ Joined product room: product_123`

### 4. Test Realtime Updates

#### Using Postman to Place a Bid
**Endpoint:** `POST http://localhost:3000/api/bids`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body (JSON):**
```json
{
  "user_id": 2,
  "product_id": 123,
  "max_bid_amount": 55000000
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Đặt giá thành công",
  "data": {
    "product_id": 123,
    "current_price": 50000000,
    "winner_id": 2,
    "bid_placed": {
      "bid_id": 456,
      "amount": 50000000,
      "max_bid_amount": 55000000
    }
  }
}
```

#### Check Both Pages
**Homepage (`/homepage`):**
- Product price should update instantly
- Winner username should update (masked)
- Console shows: `🔔 Received minimal update`

**Product Detail (`/product/123`):**
- Price updates with green highlight animation
- Winner username + rating score updates
- Bid count increases by 1
- Countdown timer continues (or extends if in last 10 min)
- Console shows: `📡 Received realtime update`

### 5. Test Multiple Browser Tabs
1. Open homepage in Tab 1
2. Open product detail in Tab 2
3. Place bid via Postman
4. **Both tabs should update simultaneously**

### 6. Test Auto Time Extension
**Scenario:** Place bid when auction has < 10 minutes remaining

1. Find product with end_time < 10 minutes from now
2. Place bid via Postman
3. **Expected:** `end_time` extends by 10 minutes
4. Check product detail page - countdown should reflect new time

---

## 🔍 API Testing Checklist

### GET /api/products?page=1&pageSize=12
**Expected Response:**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "product_id": 123,
      "product_name": "iPhone 15 Pro Max",
      "current_price": "50000000",
      "avatar": "http://example.com/image.jpg",
      "highestBidder": {
        "user_id": 2,
        "username": "john_doe",
        "full_name": "John Doe"
      },
      "bidCount": 5,
      ...
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 12,
    "totalItems": 50,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### GET /api/products/123/details
**Expected Response:**
```json
{
  "success": true,
  "message": "Product details retrieved successfully",
  "data": {
    "product_id": 123,
    "product_name": "iPhone 15 Pro Max",
    "current_price": "50000000",
    "start_price": "30000000",
    "buy_now_price": "60000000",
    "step_price": "1000000",
    "start_time": "2024-01-01T00:00:00.000Z",
    "end_time": "2024-01-10T00:00:00.000Z",
    "status": "active",
    "highestBidder": {
      "user_id": 2,
      "username": "john_doe",
      "full_name": "John Doe",
      "rating_score": 4.5
    },
    "bidCount": 5,
    "winner": {
      "user_id": 2,
      "username": "john_doe",
      "full_name": "John Doe",
      "rating_score": 4.5
    },
    "seller": { ... },
    "category": { ... },
    "mainImage": "...",
    "subImages": [...],
    "descriptions": [...],
    "questions": [...]
  }
}
```

### GET /api/bids/history/123
**Expected Response:**
```json
{
  "success": true,
  "message": "Bid history retrieved successfully",
  "data": [
    {
      "bid_id": 456,
      "product_id": 123,
      "amount": "50000000",
      "max_bid_amount": "55000000",
      "bid_time": "2024-01-05T10:30:00.000Z",
      "status": 1,
      "bidder": {
        "user_id": 2,
        "username": "john_doe",
        "full_name": "John Doe"
      }
    }
  ]
}
```

### GET /api/bids/123/next-price
**Expected Response:**
```json
{
  "success": true,
  "message": "Next valid bid price calculated",
  "data": {
    "product_id": 123,
    "current_price": "50000000",
    "step_price": "1000000",
    "next_valid_price": "51000000"
  }
}
```

### GET /api/bids/123/bid-availability?user_id=2
**Expected Response:**
```json
{
  "success": true,
  "message": "User can bid on this product",
  "data": {
    "can_bid": true,
    "user_id": 2,
    "product_id": 123,
    "checks": {
      "is_seller": false,
      "has_rating": true,
      "rating_eligible": true,
      "auction_started": true,
      "auction_not_ended": true
    }
  }
}
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot GET /homepage"
**Solution:** Make sure static file serving is enabled:
```javascript
// server.js
app.use(express.static('public'));
```

### Issue 2: "Product details not loading"
**Check:**
- Database has product with the ID in URL
- Product status is 'active'
- Product has valid start_time and end_time

### Issue 3: "Socket.io not connecting"
**Check Console:**
- Look for CORS errors
- Verify Socket.io server is initialized: `initializeSocket(server)`
- Check if `realtimeBidService.setSocketIO(io)` is called

### Issue 4: "Countdown timer not updating"
**Check:**
- `auctionEndTime` is set correctly
- `startCountdown()` is called after data load
- No JavaScript errors in console

### Issue 5: "Bid history empty"
**Check:**
- Database has bids with `status = 1` for the product
- API `/api/bids/history/:productId` returns data
- `loadBidHistory()` is called in DOMContentLoaded

---

## 📊 Expected Behavior Summary

| Action | Homepage | Product Detail |
|--------|----------|----------------|
| **Initial Load** | List all products | Show product details + countdown |
| **New Bid (Postman)** | Price + winner update | Price + winner + count update |
| **Socket Update** | Minimal data (price, winner) | Full data (price, winner, count, time) |
| **Timer** | No timer | Countdown updates every 1s |
| **Navigation** | Click "Xem chi tiết" → `/product/:id` | Back button → homepage |
| **Multiple Tabs** | All tabs sync via Socket.io | All tabs sync via Socket.io |

---

## 🎯 Success Criteria

✅ Homepage loads with real database products  
✅ Product detail page loads with all info from API  
✅ Countdown timer updates every second  
✅ Socket.io connection established (green status)  
✅ Placing bid via Postman updates both pages instantly  
✅ Winner username is properly masked (first half hidden)  
✅ Bid count increments correctly  
✅ No console errors  
✅ Multiple tabs receive same updates  
✅ Auto time extension works when bid in last 10 min  

---

## 📝 Notes

- **Username Masking:** First 50% of characters replaced with `*`
  - `john_doe` → `****_doe`
  - `alice` → `**ice`

- **Room Architecture:**
  - Homepage joins `homepage_feed` (minimal data)
  - Product detail joins `product_123` (full data)
  - Both receive updates when bid placed

- **Price Update Animation:**
  - Product detail has green highlight for 500ms
  - Homepage updates without animation

- **Countdown Timer:**
  - Updates every 1 second via `setInterval`
  - Shows "ĐÃ KẾT THÚC" when time expires
  - Red color when < 5 minutes
  - Orange color when < 30 minutes

- **API Structure:**
  - All responses have `{success: boolean, message: string, data: object}`
  - Bid APIs return structured errors: `{success: false, message: "..."}`

---

## 🔧 Development Tips

### To add new products for testing:
```sql
INSERT INTO products (product_name, start_price, current_price, step_price, 
                      start_time, end_time, status, seller_id, category_id)
VALUES ('Test Product', 10000000, 10000000, 500000, 
        NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 'active', 1, 1);
```

### To simulate auto-extension scenario:
```sql
UPDATE products 
SET end_time = DATE_ADD(NOW(), INTERVAL 5 MINUTE)
WHERE product_id = 123;
```

### To reset bid history:
```sql
DELETE FROM bids WHERE product_id = 123;
UPDATE products SET current_price = start_price, winner_id = NULL WHERE product_id = 123;
```

---

Happy Testing! 🎉
