# Watchlist API Documentation

## Base URL
```
http://localhost:3000/api/watchlist
```

## Endpoints

### 1. Add Product to Watchlist
**POST** `/api/watchlist/add`

Add a product to a user's watchlist.

**Request Body:**
```json
{
  "user_id": 3,
  "product_id": 1
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Product added to watchlist successfully",
  "data": {
    "user_id": 3,
    "product_id": 1
  }
}
```

**Error Responses:**
- **400 Bad Request** - Missing required fields
```json
{
  "success": false,
  "message": "user_id and product_id are required"
}
```

- **404 Not Found** - User or Product not found
```json
{
  "success": false,
  "message": "User not found"
}
```

- **409 Conflict** - Product already in watchlist
```json
{
  "success": false,
  "message": "Product is already in watchlist"
}
```

---

### 2. Remove Product from Watchlist
**DELETE** `/api/watchlist/remove`

Remove a product from a user's watchlist.

**Request Body:**
```json
{
  "user_id": 3,
  "product_id": 1
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Product removed from watchlist successfully"
}
```

**Error Responses:**
- **400 Bad Request** - Missing required fields
```json
{
  "success": false,
  "message": "user_id and product_id are required"
}
```

- **404 Not Found** - Product not in watchlist
```json
{
  "success": false,
  "message": "Product not found in watchlist"
}
```

---

### 3. Get User's Watchlist
**GET** `/api/watchlist/:user_id`

Retrieve all products in a user's watchlist with product details.

**URL Parameters:**
- `user_id` (required) - The ID of the user

**Example Request:**
```
GET /api/watchlist/3
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Watchlist retrieved successfully",
  "data": [
    {
      "user_id": 3,
      "product_id": 1,
      "product": {
        "product_id": 1,
        "product_name": "iPhone 15 Pro Max",
        "current_price": "12100000.00",
        "start_value": "10000000.00",
        "end_time": "2025-10-30T00:00:00.000Z",
        "status": "active"
      }
    }
  ],
  "count": 1
}
```

**Error Responses:**
- **400 Bad Request** - Missing user_id
```json
{
  "success": false,
  "message": "user_id is required"
}
```

- **404 Not Found** - User not found
```json
{
  "success": false,
  "message": "User not found"
}
```

---

## Testing with cURL

### Add to Watchlist
```bash
curl -X POST http://localhost:3000/api/watchlist/add \
  -H "Content-Type: application/json" \
  -d '{"user_id": 3, "product_id": 1}'
```

### Remove from Watchlist
```bash
curl -X DELETE http://localhost:3000/api/watchlist/remove \
  -H "Content-Type: application/json" \
  -d '{"user_id": 3, "product_id": 1}'
```

### Get User's Watchlist
```bash
curl -X GET http://localhost:3000/api/watchlist/3
```

---

## Testing with PowerShell (Invoke-WebRequest)

### Add to Watchlist
```powershell
$body = @{
    user_id = 3
    product_id = 1
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/watchlist/add" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Remove from Watchlist
```powershell
$body = @{
    user_id = 3
    product_id = 1
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/watchlist/remove" `
  -Method DELETE `
  -ContentType "application/json" `
  -Body $body
```

### Get User's Watchlist
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/watchlist/3" -Method GET
```

---

## Notes

- All endpoints return JSON responses
- Error responses include a `success: false` flag and a descriptive `message`
- The database connection is validated on server startup
- Make sure your MySQL server is running before starting the application
