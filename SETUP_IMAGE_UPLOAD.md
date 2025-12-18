# Setup Hướng dẫn Cài đặt Upload Ảnh

## 🚀 Bước 1: Cài đặt Dependencies

Chạy lệnh sau trong thư mục `src`:

```bash
npm install multer cloudinary
```

**Verify cài đặt:**
```bash
npm ls multer cloudinary
```

Expected output:
```
├── cloudinary@1.40.0
└── multer@1.4.5-lts.1
```

---

## 📋 Bước 2: Verify Environment Variables

Kiểm tra file `.env` trong thư mục `src` có chứa các biến sau:

```env
CLOUDINARY_CLOUD_NAME=dyof5jj4b
CLOUDINARY_API_KEY=314321135497468
CLOUDINARY_API_SECRET=zB6_kMRNGVNQ7Yg7tbpd7V5mAAQ
```

✅ Hiện tại bạn đã có tất cả các credentials cần thiết!

---

## 📂 Bước 3: Verify Files Structure

Kiểm tra các files đã được tạo:

```
src/
├── config/
│   ├── cloudinary.js          ✅ (Tạo mới)
│   ├── multer.js              ✅ (Tạo mới)
│   └── ... (files khác)
├── controllers/
│   └── productController.js   ✅ (Cập nhật)
├── middlewares/
│   └── productValidator.js    ✅ (Cập nhật)
├── routes/
│   └── product.js             ✅ (Cập nhật)
└── services/
    └── productCreationService.js  ✅ (Cập nhật)
```

---

## ✅ Bước 4: Test Upload Ảnh

### Test bằng cURL

```bash
# 1. Đầu tiên, login để lấy token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seller@example.com",
    "password": "Password123!"
  }'

# Response sẽ có accessToken
# Copy token này để sử dụng ở bước 2

# 2. Upload sản phẩm với ảnh
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer {YOUR_ACCESS_TOKEN}" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg" \
  -F "images=@/path/to/image3.jpg" \
  -F "product_name=iPhone 15 Pro" \
  -F "category_id=5" \
  -F "start_price=1000000" \
  -F "step_price=100000" \
  -F "buy_now_price=8000000" \
  -F "end_time=2025-12-20T10:30:00Z" \
  -F "description=<p>Điện thoại mới 100%</p>" \
  -F "auto_renewal=true" \
  -F "allow_new_users=false"
```

### Test bằng Postman

1. **Create new request → POST**
2. **URL:** `http://localhost:3000/api/products`
3. **Headers:**
   ```
   Authorization: Bearer {YOUR_ACCESS_TOKEN}
   ```
4. **Body → form-data:**
   ```
   images          : [Select 3-10 image files]
   product_name    : iPhone 15 Pro
   category_id     : 5
   start_price     : 1000000
   step_price      : 100000
   buy_now_price   : 8000000
   end_time        : 2025-12-20T10:30:00Z
   description     : <p>Điện thoại mới 100%</p>
   auto_renewal    : true
   allow_new_users : false
   ```
5. **Click Send**

### Expected Response

**Success (201):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "product_id": 123,
    "product_name": "iPhone 15 Pro",
    "current_price": 1000000,
    "images": [
      {
        "image_id": 1,
        "img_url": "https://res.cloudinary.com/dyof5jj4b/image/upload/online-auction/products/..."
      }
    ]
  }
}
```

---

## 🐛 Debug Logs

Khi test, bạn sẽ thấy logs như:

```
✅ User connected to server
⬆️ Uploading 3 images to Cloudinary...
✅ Successfully uploaded 3 images to Cloudinary
```

Nếu có lỗi, sẽ thấy:
```
❌ Error uploading images to Cloudinary: ...
```

---

## 🔍 Troubleshooting Khi Cài đặt

### Error: Cannot find module 'multer'

**Nguyên nhân:** Multer chưa được cài đặt
**Giải pháp:**
```bash
npm install multer
npm install cloudinary
```

### Error: CLOUDINARY_CLOUD_NAME is undefined

**Nguyên nhân:** `.env` không được load
**Giải pháp:**
1. Kiểm tra file `.env` trong thư mục `src`
2. Restart server: `npm run dev`

### Error: Cloudinary API error

**Nguyên nhân:** Credentials sai hoặc Cloudinary không khả dụng
**Giải pháp:**
1. Verify credentials trong `.env`
2. Check Cloudinary account: https://cloudinary.com/console
3. Ensure API key & secret là chính xác

### Images không upload lên Cloudinary

**Kiểm tra:**
1. Multer đã nhận files chưa? (Check `req.files`)
2. Files có valid type không? (JPEG, PNG, GIF, WebP)
3. File size < 5MB không?
4. Backend logs có error không?

---

## 📊 Giám sát Upload

### Check Cloudinary Media Library

1. Vào https://cloudinary.com/console/media_library
2. Xem folder `online-auction/products`
3. Verify images đã upload

### Check Database

```sql
SELECT * FROM ProductImages WHERE product_id = 123;
```

Expected output:
```
| image_id | product_id | img_url                                                           |
|----------|------------|------------------------------------------------------------------|
| 1        | 123        | https://res.cloudinary.com/dyof5jj4b/image/upload/v...           |
| 2        | 123        | https://res.cloudinary.com/dyof5jj4b/image/upload/v...           |
| 3        | 123        | https://res.cloudinary.com/dyof5jj4b/image/upload/v...           |
```

---

## 🎯 Next Steps

Sau khi setup xong:

1. **Test API** bằng Postman hoặc cURL
2. **Create Frontend Form** sử dụng guide từ [PRODUCT_IMAGE_UPLOAD_GUIDE.md](PRODUCT_IMAGE_UPLOAD_GUIDE.md)
3. **Integrate with React/Vue** component
4. **Test end-to-end** flow (upload → Cloudinary → Database)

---

## 📞 Support

Nếu gặp vấn đề:
1. Check logs từ backend: `npm run dev`
2. Check Cloudinary account & API keys
3. Verify `.env` file đầy đủ
4. Test với cURL trước khi test frontend

---

**Last Updated:** December 15, 2025
