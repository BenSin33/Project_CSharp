# 🧪 Kịch Bản Testing API InteractHub - Postman/Swagger

## 📋 Mục Lục
1. [Chuẩn Bị Dữ Liệu Test](#chuẩn-bị-dữ-liệu-test)
2. [Kịch Bản Test Bài Viết](#kịch-bản-test-bài-viết)
3. [Kịch Bản Test Tìm Kiếm](#kịch-bản-test-tìm-kiếm)
4. [Kịch Bản Test Lưu Bài Viết](#kịch-bản-test-lưu-bài-viết)
5. [Kịch Bản Test Tương Tác](#kịch-bản-test-tương-tác)
6. [Kịch Bản Test Phân Trang](#kịch-bản-test-phân-trang)
7. [Kịch Bản Test Lỗi & Edge Cases](#kịch-bản-test-lỗi--edge-cases)

---

## 🔐 Chuẩn Bị Dữ Liệu Test

### **Bước 1: Đăng Ký / Đăng Nhập Tài Khoản**

#### Request 1: Đăng Nhập để Lấy Token

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user1@example.com",
  "password": "password123"
}
```

**Response (Lưu Token này):**
```json
{
  "id": "223e4567-e89b-12d3-a456-426614174000",
  "email": "user1@example.com",
  "fullName": "Nguyễn Văn A",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "..."
}
```

**💾 Lưu biến Postman:**
- **Token_User1**: `{{response.body.accessToken}}`
- **UserId_User1**: `223e4567-e89b-12d3-a456-426614174000`

---

#### Request 2: Đăng Nhập User Thứ 2 (để test tương tác)

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user2@example.com",
  "password": "password123"
}
```

**💾 Lưu biến:**
- **Token_User2**: `{{response.body.accessToken}}`
- **UserId_User2**: `{{response.body.id}}`

---

### **Bước 2: Tạo Dữ Liệu Test - Bài Viết Mẫu**

#### Request 3: User1 Tạo Bài Viết #1

```
POST /api/post
Authorization: Bearer {{Token_User1}}
Content-Type: application/json

{
  "content": "Xin chào mọi người! Đây là bài viết về lập trình C#",
  "visibility": "public",
  "status": "active",
  "postMedias": []
}
```

**💾 Lưu:** `{{response.body.id}}` → **PostId_1**

---

#### Request 4: User1 Tạo Bài Viết #2

```
POST /api/post
Authorization: Bearer {{Token_User1}}
Content-Type: application/json

{
  "content": "Hôm nay mình học xong ASP.NET Core, rất tuyệt!",
  "visibility": "public",
  "status": "active",
  "postMedias": []
}
```

**💾 Lưu:** `{{response.body.id}}` → **PostId_2**

---

#### Request 5: User1 Tạo Bài Viết #3 (Công Khai)

```
POST /api/post
Authorization: Bearer {{Token_User1}}
Content-Type: application/json

{
  "content": "Mẹo lập trình: Sử dụng LINQ để làm code gọn hơn",
  "visibility": "public",
  "status": "active",
  "postMedias": []
}
```

**💾 Lưu:** `{{response.body.id}}` → **PostId_3**

---

#### Request 6: User2 Tạo Bài Viết #4

```
POST /api/post
Authorization: Bearer {{Token_User2}}
Content-Type: application/json

{
  "content": "Python là ngôn ngữ lập trình tuyệt vời",
  "visibility": "public",
  "status": "active",
  "postMedias": []
}
```

**💾 Lưu:** `{{response.body.id}}` → **PostId_4**

---

## 📝 Kịch Bản Test Bài Viết

### **Kịch Bản 1: Lấy Danh Sách Bài Viết (GET /post)**

#### Test 1.1: Lấy Danh Sách Bài Viết - Default

```
GET /api/post
Content-Type: application/json
```

**Expected Response:**
- Status: **200 OK**
- Body có các fields:
  - `data[]` - Mảng bài viết
  - `total` - Tổng số bài
  - `skip` - 0
  - `take` - 20 (default)
  - `totalPages` - Tính từ total/take
  - `hasNextPage` - true/false

**Kiểm tra:**
```
✓ Status là 200
✓ data[] không rỗng (nếu có dữ liệu)
✓ Mỗi bài viết có author object với fullName, email, avatarUrl
✓ Mỗi bài viết có likeCount, commentCount, shareCount
✓ Mỗi bài viết có likeSummary với topLikes[]
✓ Mỗi bài viết có topComments[]
✓ Mỗi bài viết có isSavedByCurrentUser = false
```

---

#### Test 1.2: Lấy Bài Viết Cụ Thể Theo ID

```
GET /api/post/{{PostId_1}}
Content-Type: application/json
```

**Expected Response:**
- Status: **200 OK**
- Trả về 1 bài viết đầy đủ với:
  - `id` = {{PostId_1}}
  - `content` = "Xin chào mọi người!..."
  - `author` object đầy đủ
  - `likeSummary` đầy đủ
  - `topComments[]` nếu có

**Kiểm tra:**
```
✓ ID trả về khớp với request
✓ Content đúng
✓ Author object có đầy đủ fields
✓ likeSummary.topLikes[] có max 10 items
✓ topComments[] có max 5 items và có user info
```

---

### **Kịch Bản 2: Lấy Bài Viết Với Xác Thực (Kiểm Tra isSavedByCurrentUser)**

#### Test 2.1: Lấy Bài Viết Khi Đã Xác Thực

```
GET /api/post/{{PostId_1}}
Authorization: Bearer {{Token_User1}}
Content-Type: application/json
```

**Bước tiếp theo: Lưu bài viết này trước**

1. POST /api/post/{{PostId_1}}/save
2. Rồi GET lại để kiểm tra `isSavedByCurrentUser`

---

## 🔍 Kịch Bản Test Tìm Kiếm

### **Kịch Bản 3: Tìm Kiếm Bài Viết (GET /post/search)**

#### Test 3.1: Tìm Kiếm Bằng Nội Dung

```
GET /api/post/search?q=lập%20trình&skip=0&take=10
Content-Type: application/json
```

**Expected Response:**
- Status: **200 OK**
- `data[]` chỉ chứa bài viết có từ "lập trình" trong content
- Phải có ít nhất PostId_1 và PostId_3

**Kiểm tra:**
```
✓ Status 200
✓ Tất cả bài viết trong data[] đều chứa "lập trình"
✓ Phân trang hoạt động (skip, take, total, totalPages)
✓ Mỗi bài viết có đầy đủ thông tin (author, likes, comments)
```

---

#### Test 3.2: Tìm Kiếm Bằng Tên Tác Giả

```
GET /api/post/search?q=nguyễn&skip=0&take=10
Content-Type: application/json
```

**Expected Response:**
- Bao gồm tất cả bài viết của "Nguyễn Văn A"
- Status: **200 OK**

---

#### Test 3.3: Tìm Kiếm Với Từ Không Tồn Tại

```
GET /api/post/search?q=xyzabc12345&skip=0&take=10
Content-Type: application/json
```

**Expected Response:**
- Status: **200 OK**
- `data[]` - Mảng rỗng
- `total` - 0

**Kiểm tra:**
```
✓ Status vẫn 200
✓ data[] rỗng []
✓ total = 0
✓ hasNextPage = false
```

---

#### Test 3.4: Tìm Kiếm Với Query Rỗng

```
GET /api/post/search?q=&skip=0&take=10
Content-Type: application/json
```

**Expected Response:**
- Status: **400 Bad Request** hoặc **200** với kết quả rỗng
- Message: "Vui lòng nhập từ khóa tìm kiếm"

---

### **Kịch Bản 4: Tìm Kiếm Người Dùng (GET /user/search)**

#### Test 4.1: Tìm Kiếm Người Dùng Theo Tên

```
GET /api/user/search?q=nguyễn&skip=0&take=10
Content-Type: application/json
```

**Expected Response:**
- Status: **200 OK**
- `data[]` chứa users có "nguyễn" trong fullName
- Mỗi user có: id, fullName, email, userName, avatarUrl, bio

**Kiểm tra:**
```
✓ Status 200
✓ data[] có ít nhất 1 user
✓ Mỗi user có đầy đủ fields
✓ Không có user bị lock
```

---

#### Test 4.2: Tìm Kiếm Theo Email

```
GET /api/user/search?q=user1@&skip=0&take=10
Content-Type: application/json
```

**Expected Response:**
- Tìm users có email chứa "user1@"

---

#### Test 4.3: Tìm Kiếm Với Phân Trang

```
GET /api/user/search?q=a&skip=0&take=5
GET /api/user/search?q=a&skip=5&take=5
Content-Type: application/json
```

**Kiểm tra:**
```
✓ Request 1 trả về items 0-4
✓ Request 2 trả về items 5-9
✓ Không có item bị trùng lặp
```

---

## 🔖 Kịch Bản Test Lưu Bài Viết

### **Kịch Bản 5: Lưu Bài Viết (POST /post/{id}/save)**

#### Test 5.1: Lưu Bài Viết Lần Đầu

```
POST /api/post/{{PostId_1}}/save
Authorization: Bearer {{Token_User1}}
Content-Type: application/json
```

**Expected Response:**
- Status: **200 OK**
- Body:
```json
{
  "id": "923e4567-e89b-12d3-a456-426614174000",
  "userId": "223e4567-e89b-12d3-a456-426614174000",
  "postId": "{{PostId_1}}",
  "createdAt": "2026-05-01T10:30:00Z",
  "updatedAt": "2026-05-01T10:30:00Z"
}
```

**💾 Lưu:** `{{response.body.id}}` → **SavedPostId_1**

**Kiểm tra:**
```
✓ Status 200
✓ userId = {{UserId_User1}}
✓ postId = {{PostId_1}}
✓ createdAt có giá trị
```

---

#### Test 5.2: Lưu Bài Viết Cùng Người, Cùng Bài Lần Thứ 2

```
POST /api/post/{{PostId_1}}/save
Authorization: Bearer {{Token_User1}}
Content-Type: application/json
```

**Expected Response:**
- Status: **200 OK**
- Trả về bản ghi SavedPost cũ (không tạo mới)

**Kiểm tra:**
```
✓ Status 200
✓ Không tạo bản ghi mới
✓ ID trả về giống Request 5.1
```

---

#### Test 5.3: Lưu Bài Viết Bởi User Khác

```
POST /api/post/{{PostId_1}}/save
Authorization: Bearer {{Token_User2}}
Content-Type: application/json
```

**Expected Response:**
- Status: **200 OK**
- Tạo SavedPost mới cho User2

---

#### Test 5.4: Lưu Bài Viết Không Tồn Tại

```
POST /api/post/00000000-0000-0000-0000-000000000000/save
Authorization: Bearer {{Token_User1}}
Content-Type: application/json
```

**Expected Response:**
- Status: **404 Not Found**
- Message: "Bài viết không tồn tại"

---

### **Kịch Bản 6: Bỏ Lưu Bài Viết (DELETE /post/{id}/unsave)**

#### Test 6.1: Bỏ Lưu Bài Viết Đã Lưu

```
DELETE /api/post/{{PostId_1}}/unsave
Authorization: Bearer {{Token_User1}}
Content-Type: application/json
```

**Expected Response:**
- Status: **200 OK**
- Body:
```json
{
  "success": true,
  "message": "Bỏ lưu bài viết thành công"
}
```

**Kiểm tra:**
```
✓ Status 200
✓ success = true
```

---

#### Test 6.2: Bỏ Lưu Bài Viết Chưa Lưu

```
DELETE /api/post/{{PostId_3}}/unsave
Authorization: Bearer {{Token_User1}}
Content-Type: application/json
```

**Expected Response:**
- Status: **200 OK** hoặc **404 Not Found**
- Nếu 200: `success = false`

---

#### Test 6.3: Xác Minh Bài Viết Đã Bị Xóa Khỏi Danh Sách Lưu

```
GET /api/post/saved?skip=0&take=20
Authorization: Bearer {{Token_User1}}
Content-Type: application/json
```

**Kiểm tra:**
```
✓ PostId_1 không có trong data[]
✓ isSavedByCurrentUser = false
```

---

### **Kịch Bản 7: Lấy Danh Sách Bài Viết Đã Lưu (GET /post/saved)**

#### Test 7.1: Lấy Bài Viết Đã Lưu (Có Quyền)

```
GET /api/post/saved?skip=0&take=20
Authorization: Bearer {{Token_User1}}
Content-Type: application/json
```

**Expected Response:**
- Status: **200 OK**
- `data[]` chỉ chứa bài viết đã lưu bởi User1
- Mỗi bài viết có `isSavedByCurrentUser = true`

**Kiểm tra:**
```
✓ Status 200
✓ data[] chỉ chứa bài viết đã lưu
✓ Tất cả items có isSavedByCurrentUser = true
✓ Phân trang hoạt động
```

---

#### Test 7.2: Lấy Bài Viết Đã Lưu Mà Không Xác Thực

```
GET /api/post/saved?skip=0&take=20
Content-Type: application/json
```

**Expected Response:**
- Status: **401 Unauthorized**

---

## ❤️ Kịch Bản Test Tương Tác (Like/Comment/Share)

### **Kịch Bản 8: Thích Bài Viết (POST /like)**

#### Test 8.1: Thích Bài Viết Lần Đầu

```
POST /api/like
Authorization: Bearer {{Token_User2}}
Content-Type: application/json

{
  "postId": "{{PostId_1}}",
  "reactionType": "like"
}
```

**Expected Response:**
- Status: **201 Created**
- Body:
```json
{
  "id": "...",
  "postId": "{{PostId_1}}",
  "userId": "{{UserId_User2}}",
  "reactionType": "like",
  "createdAt": "2026-05-01T10:30:00Z"
}
```

---

#### Test 8.2: Kiểm Tra likeCount Tăng

```
GET /api/post/{{PostId_1}}
```

**Kiểm tra:**
```
✓ likeCount tăng lên 1
✓ likeSummary.totalLikes = 1
✓ likeSummary.topLikes[] có User2
✓ User1 có thể thấy User2 đã like
```

---

#### Test 8.3: Thích Bằng Reaction Khác

```
POST /api/like
Authorization: Bearer {{Token_User1}}
Content-Type: application/json

{
  "postId": "{{PostId_1}}",
  "reactionType": "love"
}
```

**Expected Response:**
- Status: **201 Created**
- reactionType: "love"

---

#### Test 8.4: Kiểm Tra reactionCounts

```
GET /api/post/{{PostId_1}}
```

**Body có:**
```json
{
  "likeSummary": {
    "reactionCounts": {
      "like": 1,
      "love": 1
    },
    "totalLikes": 2
  }
}
```

---

### **Kịch Bản 9: Bình Luận (POST /comment)**

#### Test 9.1: Tạo Bình Luận

```
POST /api/comment
Authorization: Bearer {{Token_User2}}
Content-Type: application/json

{
  "postId": "{{PostId_1}}",
  "content": "Bài viết rất hay! Mình thích cách bạn giải thích",
  "parentCommentId": null
}
```

**Expected Response:**
- Status: **201 Created**
- Body có id, postId, content, userId, createdAt

---

#### Test 9.2: Kiểm Tra commentCount Tăng

```
GET /api/post/{{PostId_1}}
```

**Kiểm tra:**
```
✓ commentCount = 1
✓ topComments[] có 1 item
✓ topComments[0].user có fullName, email, avatarUrl
✓ topComments[0].content = "Bài viết rất hay!..."
```

---

#### Test 9.3: Tạo Bình Luận Thứ 2

```
POST /api/comment
Authorization: Bearer {{Token_User1}}
Content-Type: application/json

{
  "postId": "{{PostId_1}}",
  "content": "Cảm ơn bạn! Hôm nay mình sẽ viết thêm bài chi tiết hơn",
  "parentCommentId": null
}
```

**Kiểm tra sau:**
```
✓ commentCount = 2
✓ topComments[] có tối đa 5 items
✓ topComments[] sắp xếp theo thời gian mới nhất trước
```

---

## 📄 Kịch Bản Test Phân Trang

### **Kịch Bản 10: Phân Trang Bài Viết (GET /post)**

#### Test 10.1: Trang Đầu (skip=0, take=2)

```
GET /api/post?skip=0&take=2
```

**Response:**
```json
{
  "data": [
    { "id": "{{PostId_4}}", ... },
    { "id": "{{PostId_3}}", ... }
  ],
  "total": 4,
  "skip": 0,
  "take": 2,
  "totalPages": 2,
  "hasNextPage": true
}
```

**Kiểm tra:**
```
✓ Trả về 2 items
✓ totalPages = 4/2 = 2
✓ hasNextPage = true
```

---

#### Test 10.2: Trang Thứ 2 (skip=2, take=2)

```
GET /api/post?skip=2&take=2
```

**Response:**
```json
{
  "data": [
    { "id": "{{PostId_2}}", ... },
    { "id": "{{PostId_1}}", ... }
  ],
  "total": 4,
  "skip": 2,
  "take": 2,
  "totalPages": 2,
  "hasNextPage": false
}
```

**Kiểm tra:**
```
✓ Trả về 2 items
✓ hasNextPage = false (đây là trang cuối)
✓ Không có item nào trùng lặp với trang 1
```

---

#### Test 10.3: Skip Vượt Quá Total

```
GET /api/post?skip=100&take=20
```

**Response:**
```json
{
  "data": [],
  "total": 4,
  "skip": 100,
  "take": 20,
  "totalPages": 1,
  "hasNextPage": false
}
```

**Kiểm tra:**
```
✓ Status 200
✓ data[] rỗng
✓ hasNextPage = false
```

---

#### Test 10.4: Take Quá Lớn

```
GET /api/post?skip=0&take=10000
```

**Response:**
- Status: **200 OK** hoặc **400 Bad Request**
- Nếu 200: Trả về max items được phép (ví dụ 1000)

---

### **Kịch Bản 11: Phân Trang Tìm Kiếm**

#### Test 11.1: Tìm Kiếm Trang 1

```
GET /api/post/search?q=lập%20trình&skip=0&take=2
```

**Kiểm tra:** 2 items đầu tiên

---

#### Test 11.2: Tìm Kiếm Trang 2

```
GET /api/post/search?q=lập%20trình&skip=2&take=2
```

**Kiểm tra:** 2 items tiếp theo, không trùng trang 1

---

## ❌ Kịch Bản Test Lỗi & Edge Cases

### **Kịch Bản 12: Lỗi Xác Thực**

#### Test 12.1: Request Không Có Token (Endpoint Authorize)

```
POST /api/post
Content-Type: application/json

{
  "content": "Test",
  "visibility": "public",
  "status": "active"
}
```

**Expected Response:**
- Status: **401 Unauthorized**
- Message: "Authorization header is missing"

---

#### Test 12.2: Token Không Hợp Lệ

```
POST /api/post
Authorization: Bearer invalid_token_12345
Content-Type: application/json

{
  "content": "Test",
  "visibility": "public",
  "status": "active"
}
```

**Expected Response:**
- Status: **401 Unauthorized**

---

### **Kịch Bản 13: Invalid Input**

#### Test 13.1: Tạo Bài Viết Với Content Rỗng

```
POST /api/post
Authorization: Bearer {{Token_User1}}
Content-Type: application/json

{
  "content": "",
  "visibility": "public",
  "status": "active"
}
```

**Expected Response:**
- Status: **400 Bad Request**
- Message: "Content không được bỏ trống"

---

#### Test 13.2: Tìm Kiếm Với Skip Âm

```
GET /api/post?skip=-1&take=20
```

**Expected Response:**
- Status: **400 Bad Request** hoặc tự động set skip=0

---

#### Test 13.3: Take = 0 Hoặc Âm

```
GET /api/post?skip=0&take=-5
```

**Expected Response:**
- Status: **400 Bad Request**
- Message: "Take phải > 0"

---

### **Kịch Bản 14: Resource Not Found**

#### Test 14.1: Lấy Bài Viết Không Tồn Tại

```
GET /api/post/00000000-0000-0000-0000-000000000000
```

**Expected Response:**
- Status: **404 Not Found**

---

#### Test 14.2: Cập Nhật Bài Viết Không Tồn Tại

```
PUT /api/post/00000000-0000-0000-0000-000000000000
Authorization: Bearer {{Token_User1}}
Content-Type: application/json

{
  "content": "Test update",
  "visibility": "public",
  "status": "active"
}
```

**Expected Response:**
- Status: **404 Not Found**

---

### **Kịch Bản 15: Quyền Truy Cập**

#### Test 15.1: User Cập Nhật Bài Viết Của User Khác

```
PUT /api/post/{{PostId_1}}
Authorization: Bearer {{Token_User2}}
Content-Type: application/json

{
  "content": "Hacker! Tôi đổi bài của bạn",
  "visibility": "public",
  "status": "active"
}
```

**Expected Response:**
- Status: **403 Forbidden** hoặc **400 Bad Request**
- Message: "Bạn không có quyền cập nhật bài viết này"

---

#### Test 15.2: User Xóa Bài Viết Của User Khác

```
DELETE /api/post/{{PostId_1}}
Authorization: Bearer {{Token_User2}}
```

**Expected Response:**
- Status: **403 Forbidden**

---

### **Kịch Bản 16: Duplicate Saves**

#### Test 16.1: Lưu Bài Viết Lần Thứ 3

```
POST /api/post/{{PostId_2}}/save
Authorization: Bearer {{Token_User1}}
POST /api/post/{{PostId_2}}/save
Authorization: Bearer {{Token_User1}}
POST /api/post/{{PostId_2}}/save
Authorization: Bearer {{Token_User1}}
```

**Kiểm tra:**
```
✓ Tất cả 3 request trả về status 200
✓ response.id giống nhau (không tạo 3 bản ghi)
✓ Lấy danh sách saved: chỉ có 1 PostId_2
```

---

## 📊 Tóm Tắt Các Test Case

| Kịch Bản | Endpoint | Method | Auth | Expected | Status |
|----------|----------|--------|------|----------|--------|
| 1.1 | /post | GET | ❌ | 200 + PaginatedResponse | ✓ |
| 1.2 | /post/{id} | GET | ❌ | 200 + PostDetail | ✓ |
| 3.1 | /post/search | GET | ❌ | 200 + Results | ✓ |
| 4.1 | /user/search | GET | ❌ | 200 + Users | ✓ |
| 5.1 | /post/{id}/save | POST | ✅ | 200 + SavedPost | ✓ |
| 6.1 | /post/{id}/unsave | DELETE | ✅ | 200 + Success | ✓ |
| 7.1 | /post/saved | GET | ✅ | 200 + Saved Posts | ✓ |
| 8.1 | /like | POST | ✅ | 201 + Like | ✓ |
| 9.1 | /comment | POST | ✅ | 201 + Comment | ✓ |
| 10.1 | /post?skip=0&take=2 | GET | ❌ | 200 + Page 1 | ✓ |
| 12.1 | /post | POST | ❌ | 401 Unauthorized | ✓ |
| 13.1 | /post | POST | ✅ | 400 Bad Request | ✓ |

---

## 🎯 Thứ Tự Chạy Test Khuyến Nghị

1. **Test Dữ Liệu** (Requests 1-6) - Tạo User & Bài Viết
2. **Test Lấy Bài Viết** (Kịch Bản 1-2) - Verify structure
3. **Test Tìm Kiếm** (Kịch Bản 3-4) - Search functionality
4. **Test Lưu Bài** (Kịch Bản 5-7) - Save/unsave
5. **Test Tương Tác** (Kịch Bản 8-9) - Like/comment
6. **Test Phân Trang** (Kịch Bản 10-11) - Pagination
7. **Test Lỗi** (Kịch Bản 12-16) - Error handling

---

## 💡 Tips Sử Dụng Postman

### Lưu Biến Trong Postman

**Sau mỗi request thành công, add script:**

```javascript
// Sau Request 1 (Login)
pm.environment.set("Token_User1", pm.response.json().accessToken);
pm.environment.set("UserId_User1", pm.response.json().id);

// Sau Request 3 (Create Post)
pm.environment.set("PostId_1", pm.response.json().id);

// Sử dụng trong request tiếp theo
// {{Token_User1}}
// {{PostId_1}}
```

### Test Assertions

**Thêm Tests tab trong Postman:**

```javascript
// Kiểm tra Status
pm.test("Status is 200", function() {
    pm.response.to.have.status(200);
});

// Kiểm tra Response có field
pm.test("Response has data field", function() {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("data");
});

// Kiểm tra data không rỗng
pm.test("Data is not empty", function() {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.length).to.be.greaterThan(0);
});

// Kiểm tra isSavedByCurrentUser
pm.test("Post has isSavedByCurrentUser field", function() {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data[0]).to.have.property("isSavedByCurrentUser");
});
```

---

## 🔄 Swagger UI Testing

Nếu dùng Swagger:

1. Truy cập: `http://localhost:5000/swagger`
2. Click vào endpoint
3. Click "Try it out"
4. Điền parameters
5. Click "Execute"
6. Xem Response

**Ưu điểm:** Dễ dùng, auto-generate request  
**Nhược điểm:** Khó lưu history, khó test complex scenarios

---

**Chúc bạn test thành công! 🎉**
