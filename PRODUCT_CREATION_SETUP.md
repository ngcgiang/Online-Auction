# Product Creation Feature - Installation Notes

## Required Dependencies

Before using the product creation feature, you need to install the `sanitize-html` package:

```bash
npm install sanitize-html
```

## Package Information

**sanitize-html**: Used to sanitize HTML content from WYSIWYG editors to prevent XSS attacks.

## API Endpoint

**POST** `/api/products`

### Request Body Example:

```json
{
  "product_name": "iPhone 15 Pro Max 256GB",
  "category_id": 2,
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg",
    "https://example.com/image3.jpg"
  ],
  "start_price": 25000000,
  "step_price": 500000,
  "buy_now_price": 30000000,
  "end_time": "2025-12-01T23:59:59Z",
  "description": "<h1>Product Description</h1><p>This is a <strong>brand new</strong> iPhone 15 Pro Max...</p>",
  "auto_renewal": true,
  "allow_new_users": false,
  "seller_id": 5
}
```

### Success Response (201):

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "product_id": 123,
    "product_name": "iPhone 15 Pro Max 256GB",
    "start_value": 25000000,
    "current_price": 25000000,
    "images": [...],
    "descriptions": [...]
  },
  "sellerInfo": {
    "daysRemaining": 5
  }
}
```

## Validation Rules

### Required Fields:
- `product_name` (3-255 characters)
- `images` (minimum 3 URLs)
- `start_price` (positive integer > 0)
- `step_price` (positive integer > 0)
- `end_time` (ISO8601 date, must be in future + at least 1 hour from now)
- `description` (minimum 10 characters)
- `seller_id` (positive integer)

### Optional Fields:
- `category_id` (positive integer)
- `buy_now_price` (must be > start_price)
- `auto_renewal` (boolean, default: false)
- `allow_new_users` (boolean, default: false, maps to `permission` in DB)

## Security Features

1. **XSS Prevention**: HTML description is sanitized using `sanitize-html`
2. **Seller Permission Check**: Validates 7-day seller permission before allowing product creation
3. **Input Validation**: All inputs validated using `express-validator`
4. **Transaction Safety**: Uses database transactions for atomic operations

## Database Tables Affected

1. **Products**: Main product record
2. **ProductImages**: Product images (minimum 3)
3. **ProductDescriptions**: Sanitized HTML description

## Notes

- `start_time` is automatically set to current time (server-side)
- First image in array becomes the primary image
- HTML description supports safe tags: h1, h2, p, strong, em, ul, li, img, span
- Seller must have valid permission (< 7 days from upgrade_at)
