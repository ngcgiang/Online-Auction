# Chức năng: Bổ sung mô tả sản phẩm (Append Product Description)

## 📋 Tổng quan

Chức năng này cho phép **người bán** (seller) thêm các bản cập nhật mô tả cho sản phẩm của họ mà **KHÔNG ghi đè** lên mô tả gốc. Tất cả các bản cập nhật được lưu dưới dạng các bản ghi riêng biệt (quan hệ 1-nhiều) để đảm bảo tính minh bạch và giữ lại lịch sử thay đổi (audit log).

## 🔐 Bảo mật

### Authentication
- ✅ Yêu cầu JWT Access Token trong header: `Authorization: Bearer <token>`
- ✅ Middleware: `verifyAccessToken`

### Authorization
- ✅ Chỉ **chủ sở hữu sản phẩm** (seller_id === currentUserId) mới được phép thêm mô tả
- ✅ Kiểm tra trong controller trước khi cho phép cập nhật

### XSS Protection
- ✅ Sử dụng `sanitize-html` để làm sạch nội dung HTML
- ✅ Chỉ cho phép các thẻ HTML an toàn
- ✅ Whitelist các thuộc tính và style cụ thể

## 🚀 API Endpoint

### POST `/api/products/:product_id/updates`

**Mô tả**: Thêm một bản cập nhật mô tả mới cho sản phẩm

#### Request Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Parameters
- `product_id` (URL param): ID của sản phẩm cần cập nhật (integer, min: 1)

#### Request Body
```json
{
  "content": "<h2>Cập nhật mới</h2><p>Thông tin bổ sung về sản phẩm...</p>"
}
```

**Validation Rules**:
- `content`: **Required**, string, minimum 10 ký tự, hỗ trợ HTML

#### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Product description updated successfully",
  "data": {
    "des_id": 123,
    "product_id": 45,
    "description": "<h2>Cập nhật mới</h2><p>Thông tin bổ sung về sản phẩm...</p>",
    "created_at": "2025-11-29T10:30:00.000Z"
  }
}
```

#### Error Responses

**400 Bad Request** - Validation failed
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "content",
      "message": "Content is required"
    }
  ]
}
```

**401 Unauthorized** - Missing token
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**403 Forbidden** - Not the owner
```json
{
  "success": false,
  "message": "Only the product owner can add description updates"
}
```

**404 Not Found** - Product not exists
```json
{
  "success": false,
  "message": "Product not found"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "An error occurred while updating product description",
  "error": "Error details..."
}
```

## 📊 Database Schema

### Table: `ProductDescriptions`

```sql
CREATE TABLE ProductDescriptions (
  des_id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  description TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES Products(product_id)
);
```

**Quan hệ**: 1 Product → N ProductDescriptions (1-nhiều)

## 📖 Lấy dữ liệu mô tả (Timeline)

Khi lấy chi tiết sản phẩm qua API `GET /api/products/:product_id/details`, các bản mô tả sẽ được trả về **sắp xếp theo thứ tự thời gian từ cũ đến mới** (oldest → newest) để tạo thành timeline:

```javascript
// Trong productService.js - getProductDetails()
{
  model: ProductDescription,
  as: 'descriptions',
  attributes: ['des_id', 'description', 'created_at'],
  order: [['created_at', 'ASC']] // Sắp xếp cũ → mới
}
```

### Example Response
```json
{
  "success": true,
  "data": {
    "product_id": 45,
    "product_name": "iPhone 15 Pro Max",
    "descriptions": [
      {
        "des_id": 1,
        "description": "<p>Mô tả ban đầu khi tạo sản phẩm</p>",
        "created_at": "2025-11-01T08:00:00Z"
      },
      {
        "des_id": 2,
        "description": "<p>Cập nhật 1: Thêm thông tin về pin</p>",
        "created_at": "2025-11-05T10:30:00Z"
      },
      {
        "des_id": 3,
        "description": "<p>Cập nhật 2: Thêm video demo</p>",
        "created_at": "2025-11-10T14:15:00Z"
      }
    ]
  }
}
```

## 🛡️ XSS Sanitization Configuration

```javascript
const sanitizedContent = sanitizeHtml(content, {
  allowedTags: [
    // Default tags + custom tags
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'p', 'a', 'ul', 'ol', 'li',
    'b', 'i', 'strong', 'em', 'strike',
    'code', 'hr', 'br', 'div', 'span',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'img' // Cho phép ảnh
  ],
  allowedAttributes: {
    '*': ['style', 'class'],
    'a': ['href', 'name', 'target'],
    'img': ['src', 'alt', 'width', 'height']
  },
  allowedStyles: {
    '*': {
      'color': [/^#[0-9a-fA-F]{3,6}$/],
      'text-align': [/^left$/, /^right$/, /^center$/],
      'font-size': [/^\d+(?:px|em|%)$/],
      'font-weight': [/^bold$/, /^normal$/],
      'background-color': [/^#[0-9a-fA-F]{3,6}$/]
    }
  }
});
```

## 🧪 Testing với Postman

### 1. Login để lấy Access Token
```
POST http://localhost:3000/api/authorization/login
Body:
{
  "email": "seller@example.com",
  "password": "password123"
}
```

### 2. Append Description
```
POST http://localhost:3000/api/products/45/updates
Headers:
  Authorization: Bearer <your_access_token>
Body:
{
  "content": "<h2>Cập nhật mới</h2><p>Thêm thông tin về <strong>bảo hành</strong></p><ul><li>Bảo hành 12 tháng</li><li>Đổi trả trong 7 ngày</li></ul>"
}
```

### 3. Get Product Details (xem timeline)
```
GET http://localhost:3000/api/products/45/details
```

## 📝 Implementation Files

### 1. Controller: `src/controllers/productController.js`
```javascript
const appendProductDescription = async (req, res, next) => {
  // 1. Validation check
  // 2. Authentication check
  // 3. Find product
  // 4. Authorization check (seller_id === currentUserId)
  // 5. Sanitize HTML content
  // 6. Create new ProductDescription record
  // 7. Return success response
}
```

### 2. Validator: `src/middlewares/productValidator.js`
```javascript
const validateAppendDescription = [
  param('product_id').isInt({ min: 1 }),
  body('content').notEmpty().isString().trim().isLength({ min: 10 })
];
```

### 3. Route: `src/routes/product.js`
```javascript
router.post(
  '/:product_id/updates',
  verifyAccessToken,           // Authentication
  validateAppendDescription,   // Validation
  handleValidationErrors,      // Error handler
  productController.appendProductDescription
);
```

### 4. Service: `src/services/productService.js`
- Updated `getProductDetails()` to sort descriptions by `created_at ASC`

## ✅ Key Features

1. ✅ **Không ghi đè mô tả gốc**: Mỗi cập nhật là một bản ghi mới
2. ✅ **Audit Log**: Giữ lại toàn bộ lịch sử thay đổi với timestamp
3. ✅ **Authorization**: Chỉ chủ sở hữu mới được cập nhật
4. ✅ **XSS Protection**: Sanitize HTML trước khi lưu DB
5. ✅ **Timeline**: Sắp xếp theo thứ tự thời gian tăng dần
6. ✅ **Validation**: Kiểm tra đầu vào chặt chẽ
7. ✅ **Error Handling**: Xử lý lỗi đầy đủ với status code chuẩn

## 🎯 Use Cases

1. **Seller thêm thông tin bổ sung**: Cập nhật spec, giá, khuyến mãi
2. **Sửa lỗi chính tả**: Thêm mô tả mới thay vì sửa mô tả cũ
3. **Transparency**: Người mua thấy được timeline thay đổi
4. **Audit**: Admin có thể theo dõi lịch sử cập nhật

## 📌 Notes

- Mô tả ban đầu được tạo khi `POST /api/products` (create product)
- Tất cả các lần cập nhật sau đó dùng `POST /api/products/:product_id/updates`
- Frontend có thể hiển thị timeline với timestamps
- Có thể thêm pagination nếu số lượng updates quá nhiều
