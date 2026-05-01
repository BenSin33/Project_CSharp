# 📚 Tài Liệu API InteractHub - Phiên Bản Tiếng Việt

## 📋 Mục Lục
1. [Giới Thiệu](#giới-thiệu)
2. [Xác Thực & Phân Quyền](#xác-thực--phân-quyền)
3. [Cấu Hình Cơ Bản](#cấu-hình-cơ-bản)
4. [Endpoints API](#endpoints-api)
5. [Các Dạng Dữ Liệu](#các-dạng-dữ-liệu)
6. [Mã Lỗi](#mã-lỗi)
7. [Ví Dụ Sử Dụng](#ví-dụ-sử-dụng)

---

## 🎯 Giới Thiệu

API InteractHub cung cấp các endpoint REST để quản lý bài viết, người dùng, lượt thích, bình luận, chia sẻ, tin nhắn, thông báo và các tính năng khác của ứng dụng mạng xã hội.

**Thông Tin API:**
- **Phiên bản**: v1.0
- **Khung công tác**: ASP.NET Core 10
- **Cơ sở dữ liệu**: SQL Server
- **Xác thực**: JWT Bearer Token
- **Định dạng dữ liệu**: JSON

---

## 🔐 Xác Thực & Phân Quyền

### JWT Bearer Token

Tất cả các endpoint bảo vệ yêu cầu gửi JWT Bearer token trong header:

```
Authorization: Bearer {token}
```

### Cách Lấy Token

1. **Đăng Ký Tài Khoản**
   ```
   POST /api/auth/register
   ```

2. **Đăng Nhập**
   ```
   POST /api/auth/login
   ```

Phản hồi sẽ chứa access token để sử dụng trong các request sau.

### Phạm Vi Truy Cập

- **[AllowAnonymous]**: Không cần xác thực (tìm kiếm công khai, xem bài viết)
- **[Authorize]**: Cần JWT token (tạo bài, thích bài, lưu bài, gửi tin nhắn)

---

## 🔧 Cấu Hình Cơ Bản

### Base URL

```
http://localhost:5000/api
```
hoặc
```
https://yourdomain.com/api
```

### Headers Chuẩn

```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {token}"
}
```

### Phân Trang

Các endpoint danh sách hỗ trợ phân trang với tham số query:

| Tham số | Kiểu | Mô tả | Mặc định |
|--------|------|-------|---------|
| `skip` | int | Số lượng bản ghi bỏ qua | 0 |
| `take` | int | Số lượng bản ghi lấy | 20 |

---

## 📡 Endpoints API

### 📝 BÌNH LUẬN (Comment)

#### Tạo Bình Luận

```http
POST /api/comment
Authorization: Bearer {token}
Content-Type: application/json

{
  "postId": "123e4567-e89b-12d3-a456-426614174000",
  "content": "Bình luận rất hay!",
  "parentCommentId": null
}
```

**Phản hồi (201 Created):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174001",
  "postId": "123e4567-e89b-12d3-a456-426614174000",
  "userId": "223e4567-e89b-12d3-a456-426614174000",
  "content": "Bình luận rất hay!",
  "createdAt": "2026-05-01T10:30:00Z",
  "updatedAt": "2026-05-01T10:30:00Z"
}
```

---

#### Cập Nhật Bình Luận

```http
PUT /api/comment/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Bình luận đã được sửa"
}
```

**Phản hồi (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174001",
  "content": "Bình luận đã được sửa",
  "updatedAt": "2026-05-01T10:35:00Z"
}
```

---

#### Xóa Bình Luận

```http
DELETE /api/comment/{id}
Authorization: Bearer {token}
```

**Phản hồi (204 No Content)**

---

### ❤️ LƯỢT THÍCH (Like)

#### Thích Bài Viết

```http
POST /api/like
Authorization: Bearer {token}
Content-Type: application/json

{
  "postId": "123e4567-e89b-12d3-a456-426614174000",
  "reactionType": "like"
}
```

**Phản hồi (201 Created):**
```json
{
  "id": "323e4567-e89b-12d3-a456-426614174000",
  "postId": "123e4567-e89b-12d3-a456-426614174000",
  "userId": "223e4567-e89b-12d3-a456-426614174000",
  "reactionType": "like",
  "createdAt": "2026-05-01T10:30:00Z"
}
```

---

#### Bỏ Thích Bài Viết

```http
DELETE /api/like/{postId}
Authorization: Bearer {token}
```

**Phản hồi (200 OK):**
```json
{
  "success": true,
  "message": "Bỏ thích thành công"
}
```

---

### 📤 CHIA SẺ (Share)

#### Chia Sẻ Bài Viết

```http
POST /api/share
Authorization: Bearer {token}
Content-Type: application/json

{
  "postId": "123e4567-e89b-12d3-a456-426614174000",
  "shareMessage": "Hãy xem bài viết này!"
}
```

**Phản hồi (201 Created):**
```json
{
  "id": "423e4567-e89b-12d3-a456-426614174000",
  "postId": "123e4567-e89b-12d3-a456-426614174000",
  "userId": "223e4567-e89b-12d3-a456-426614174000",
  "shareMessage": "Hãy xem bài viết này!",
  "createdAt": "2026-05-01T10:30:00Z"
}
```

---

#### Xóa Chia Sẻ

```http
DELETE /api/share/{id}
Authorization: Bearer {token}
```

**Phản hồi (204 No Content)**

---

### 📌 BÀI VIẾT (Post)

#### Lấy Tất Cả Bài Viết (Có Phân Trang)

```http
GET /api/post?skip=0&take=20
```

**Phản hồi (200 OK):**
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "content": "Nội dung bài viết",
      "status": "active",
      "visibility": "public",
      "author": {
        "id": "223e4567-e89b-12d3-a456-426614174000",
        "fullName": "Nguyễn Văn A",
        "email": "user@example.com",
        "avatarUrl": "https://example.com/avatar.jpg",
        "bio": "Lập trình viên"
      },
      "likeCount": 150,
      "commentCount": 25,
      "shareCount": 10,
      "isSavedByCurrentUser": false,
      "likeSummary": {
        "totalLikes": 150,
        "reactionCounts": {
          "like": 145,
          "love": 5
        },
        "currentUserReaction": null,
        "topLikes": [
          {
            "id": "523e4567-e89b-12d3-a456-426614174000",
            "user": {
              "id": "323e4567-e89b-12d3-a456-426614174000",
              "fullName": "Trần Thị B",
              "email": "user2@example.com",
              "avatarUrl": null,
              "bio": null
            },
            "reactionType": "like",
            "createdAt": "2026-05-01T09:15:00Z"
          }
        ]
      },
      "topComments": [
        {
          "id": "623e4567-e89b-12d3-a456-426614174000",
          "postId": "123e4567-e89b-12d3-a456-426614174000",
          "content": "Bình luận hay",
          "user": {
            "id": "323e4567-e89b-12d3-a456-426614174000",
            "fullName": "Trần Thị B",
            "email": "user2@example.com",
            "avatarUrl": null,
            "bio": null
          },
          "createdAt": "2026-05-01T09:20:00Z",
          "updatedAt": "2026-05-01T09:20:00Z"
        }
      ],
      "postMedias": [
        {
          "id": "723e4567-e89b-12d3-a456-426614174000",
          "postId": "123e4567-e89b-12d3-a456-426614174000",
          "mediaUrl": "https://example.com/media.jpg",
          "mediaType": "image"
        }
      ],
      "createdAt": "2026-05-01T08:00:00Z",
      "updatedAt": "2026-05-01T08:00:00Z"
    }
  ],
  "total": 1500,
  "skip": 0,
  "take": 20,
  "totalPages": 75,
  "hasNextPage": true
}
```

---

#### Lấy Bài Viết Theo ID

```http
GET /api/post/{id}
```

**Phản hồi (200 OK):**
Tương tự như trên, trả về một bài viết chi tiết.

---

#### Tìm Kiếm Bài Viết

```http
GET /api/post/search?q=lập trình&skip=0&take=20
```

**Tham số Query:**
| Tham số | Bắt buộc | Kiểu | Mô tả |
|--------|---------|------|-------|
| `q` | ✅ | string | Từ khóa tìm kiếm |
| `skip` | ❌ | int | Số bản ghi bỏ qua (mặc định: 0) |
| `take` | ❌ | int | Số bản ghi lấy (mặc định: 20) |

**Phản hồi (200 OK):**
```json
{
  "data": [
    { /* Bài viết như trên */ }
  ],
  "total": 50,
  "skip": 0,
  "take": 20,
  "totalPages": 3,
  "hasNextPage": true
}
```

---

#### Tạo Bài Viết

```http
POST /api/post
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Nội dung bài viết mới",
  "visibility": "public",
  "status": "active",
  "postMedias": [
    {
      "mediaUrl": "https://example.com/photo.jpg",
      "mediaType": "image"
    }
  ]
}
```

**Phản hồi (201 Created):**
```json
{
  "id": "823e4567-e89b-12d3-a456-426614174000",
  "content": "Nội dung bài viết mới",
  "visibility": "public",
  "status": "active",
  "userId": "223e4567-e89b-12d3-a456-426614174000",
  "createdAt": "2026-05-01T10:30:00Z"
}
```

---

#### Cập Nhật Bài Viết

```http
PUT /api/post/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Nội dung bài viết đã cập nhật",
  "visibility": "public",
  "status": "active"
}
```

**Phản hồi (200 OK):**
```json
{
  "id": "823e4567-e89b-12d3-a456-426614174000",
  "content": "Nội dung bài viết đã cập nhật",
  "updatedAt": "2026-05-01T10:35:00Z"
}
```

---

#### Xóa Bài Viết

```http
DELETE /api/post/{id}
Authorization: Bearer {token}
```

**Phản hồi (204 No Content)**

---

### 🔖 BÀI VIẾT ĐÃ LƯU (Saved Posts)

#### Lưu Bài Viết

```http
POST /api/post/{id}/save
Authorization: Bearer {token}
```

**Phản hồi (200 OK):**
```json
{
  "id": "923e4567-e89b-12d3-a456-426614174000",
  "userId": "223e4567-e89b-12d3-a456-426614174000",
  "postId": "123e4567-e89b-12d3-a456-426614174000",
  "createdAt": "2026-05-01T10:30:00Z",
  "updatedAt": "2026-05-01T10:30:00Z"
}
```

---

#### Bỏ Lưu Bài Viết

```http
DELETE /api/post/{id}/unsave
Authorization: Bearer {token}
```

**Phản hồi (200 OK):**
```json
{
  "success": true,
  "message": "Bỏ lưu bài viết thành công"
}
```

---

#### Lấy Danh Sách Bài Viết Đã Lưu

```http
GET /api/post/saved?skip=0&take=20
Authorization: Bearer {token}
```

**Phản hồi (200 OK):**
```json
{
  "data": [
    { /* Bài viết như trên */ }
  ],
  "total": 45,
  "skip": 0,
  "take": 20,
  "totalPages": 3,
  "hasNextPage": true
}
```

---

### 👤 NGƯỜI DÙNG (User)

#### Tìm Kiếm Người Dùng

```http
GET /api/user/search?q=nguyễn&skip=0&take=20
```

**Tham số Query:**
| Tham số | Bắt buộc | Kiểu | Mô tả |
|--------|---------|------|-------|
| `q` | ✅ | string | Từ khóa tìm kiếm (tên, email, tài khoản) |
| `skip` | ❌ | int | Số bản ghi bỏ qua (mặc định: 0) |
| `take` | ❌ | int | Số bản ghi lấy (mặc định: 20) |

**Phản hồi (200 OK):**
```json
{
  "data": [
    {
      "id": "223e4567-e89b-12d3-a456-426614174000",
      "fullName": "Nguyễn Văn A",
      "email": "user@example.com",
      "userName": "nguyenvana",
      "avatarUrl": "https://example.com/avatar.jpg",
      "bio": "Lập trình viên fullstack",
      "phoneNumber": "+84912345678",
      "dateOfBirth": "1990-05-15",
      "isOnline": true,
      "lastSeen": "2026-05-01T10:30:00Z"
    }
  ],
  "total": 150,
  "skip": 0,
  "take": 20,
  "totalPages": 8,
  "hasNextPage": true
}
```

---

#### Lấy Thông Tin Người Dùng

```http
GET /api/user/{id}
```

**Phản hồi (200 OK):**
```json
{
  "id": "223e4567-e89b-12d3-a456-426614174000",
  "fullName": "Nguyễn Văn A",
  "email": "user@example.com",
  "userName": "nguyenvana",
  "avatarUrl": "https://example.com/avatar.jpg",
  "bio": "Lập trình viên fullstack",
  "phoneNumber": "+84912345678",
  "dateOfBirth": "1990-05-15",
  "isOnline": true,
  "lastSeen": "2026-05-01T10:30:00Z",
  "createdAt": "2025-01-01T08:00:00Z"
}
```

---

#### Cập Nhật Thông Tin Người Dùng

```http
PUT /api/user/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "fullName": "Nguyễn Văn A - Updated",
  "bio": "Lập trình viên fullstack - Cập nhật",
  "avatarUrl": "https://example.com/new-avatar.jpg",
  "dateOfBirth": "1990-05-15",
  "phoneNumber": "+84987654321"
}
```

**Phản hồi (200 OK):**
```json
{
  "id": "223e4567-e89b-12d3-a456-426614174000",
  "fullName": "Nguyễn Văn A - Updated",
  "bio": "Lập trình viên fullstack - Cập nhật",
  "updatedAt": "2026-05-01T10:35:00Z"
}
```

---

### 📨 TIN NHẮN (Message)

#### Gửi Tin Nhắn

```http
POST /api/message
Authorization: Bearer {token}
Content-Type: application/json

{
  "receiverId": "323e4567-e89b-12d3-a456-426614174000",
  "content": "Xin chào, bạn khỏe không?",
  "messageType": "text"
}
```

**Phản hồi (201 Created):**
```json
{
  "id": "a23e4567-e89b-12d3-a456-426614174000",
  "senderId": "223e4567-e89b-12d3-a456-426614174000",
  "receiverId": "323e4567-e89b-12d3-a456-426614174000",
  "content": "Xin chào, bạn khỏe không?",
  "messageType": "text",
  "isRead": false,
  "createdAt": "2026-05-01T10:30:00Z"
}
```

---

#### Lấy Danh Sách Tin Nhắn

```http
GET /api/message/{userId}?skip=0&take=50
Authorization: Bearer {token}
```

**Phản hồi (200 OK):**
```json
{
  "data": [
    {
      "id": "a23e4567-e89b-12d3-a456-426614174000",
      "senderId": "223e4567-e89b-12d3-a456-426614174000",
      "receiverId": "323e4567-e89b-12d3-a456-426614174000",
      "content": "Xin chào, bạn khỏe không?",
      "isRead": true,
      "createdAt": "2026-05-01T10:30:00Z"
    }
  ],
  "total": 245,
  "skip": 0,
  "take": 50,
  "totalPages": 5,
  "hasNextPage": true
}
```

---

#### Đánh Dấu Tin Nhắn Là Đã Đọc

```http
PUT /api/message/{id}/mark-as-read
Authorization: Bearer {token}
```

**Phản hồi (200 OK):**
```json
{
  "success": true,
  "message": "Tin nhắn đã được đánh dấu là đã đọc"
}
```

---

### 🔔 THÔNG BÁO (Notification)

#### Lấy Danh Sách Thông Báo

```http
GET /api/notification?skip=0&take=20
Authorization: Bearer {token}
```

**Phản hồi (200 OK):**
```json
{
  "data": [
    {
      "id": "b23e4567-e89b-12d3-a456-426614174000",
      "userId": "223e4567-e89b-12d3-a456-426614174000",
      "type": "like",
      "content": "Nguyễn Văn B đã thích bài viết của bạn",
      "relatedId": "123e4567-e89b-12d3-a456-426614174000",
      "isRead": false,
      "createdAt": "2026-05-01T10:30:00Z"
    }
  ],
  "total": 85,
  "skip": 0,
  "take": 20,
  "totalPages": 5,
  "hasNextPage": true
}
```

---

#### Đánh Dấu Thông Báo Là Đã Đọc

```http
PUT /api/notification/{id}/mark-as-read
Authorization: Bearer {token}
```

**Phản hồi (200 OK):**
```json
{
  "success": true,
  "message": "Thông báo đã được đánh dấu là đã đọc"
}
```

---

#### Xóa Thông Báo

```http
DELETE /api/notification/{id}
Authorization: Bearer {token}
```

**Phản hồi (204 No Content)**

---

### 👥 BẠNHOA (Friendship)

#### Gửi Lời Mời Kết Bạn

```http
POST /api/friendship/request
Authorization: Bearer {token}
Content-Type: application/json

{
  "receiverId": "323e4567-e89b-12d3-a456-426614174000"
}
```

**Phản hồi (201 Created):**
```json
{
  "id": "c23e4567-e89b-12d3-a456-426614174000",
  "requesterId": "223e4567-e89b-12d3-a456-426614174000",
  "receiverId": "323e4567-e89b-12d3-a456-426614174000",
  "status": "pending",
  "createdAt": "2026-05-01T10:30:00Z"
}
```

---

#### Chấp Nhận Lời Mời Kết Bạn

```http
POST /api/friendship/accept/{id}
Authorization: Bearer {token}
```

**Phản hồi (200 OK):**
```json
{
  "id": "c23e4567-e89b-12d3-a456-426614174000",
  "status": "accepted",
  "updatedAt": "2026-05-01T10:35:00Z"
}
```

---

#### Từ Chối Lời Mời Kết Bạn

```http
POST /api/friendship/reject/{id}
Authorization: Bearer {token}
```

**Phản hồi (200 OK):**
```json
{
  "success": true,
  "message": "Lời mời kết bạn đã bị từ chối"
}
```

---

#### Hủy Kết Bạn

```http
DELETE /api/friendship/{id}
Authorization: Bearer {token}
```

**Phản hồi (204 No Content)**

---

### 📖 CẬP NHẬT (Story)

#### Tạo Cập Nhật (Story)

```http
POST /api/story
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Nội dung cập nhật",
  "storyMedias": [
    {
      "mediaUrl": "https://example.com/story.jpg",
      "mediaType": "image"
    }
  ]
}
```

**Phản hồi (201 Created):**
```json
{
  "id": "d23e4567-e89b-12d3-a456-426614174000",
  "userId": "223e4567-e89b-12d3-a456-426614174000",
  "content": "Nội dung cập nhật",
  "createdAt": "2026-05-01T10:30:00Z"
}
```

---

#### Lấy Danh Sách Cập Nhật

```http
GET /api/story?skip=0&take=20
Authorization: Bearer {token}
```

**Phản hồi (200 OK):**
```json
{
  "data": [
    {
      "id": "d23e4567-e89b-12d3-a456-426614174000",
      "userId": "223e4567-e89b-12d3-a456-426614174000",
      "content": "Nội dung cập nhật",
      "author": {
        "id": "223e4567-e89b-12d3-a456-426614174000",
        "fullName": "Nguyễn Văn A",
        "avatarUrl": "https://example.com/avatar.jpg"
      },
      "storyMedias": [],
      "expiresAt": "2026-05-02T10:30:00Z",
      "createdAt": "2026-05-01T10:30:00Z"
    }
  ],
  "total": 50,
  "skip": 0,
  "take": 20,
  "totalPages": 3,
  "hasNextPage": true
}
```

---

## 📊 Các Dạng Dữ Liệu

### PostResponseDto

```json
{
  "id": "uuid",
  "content": "string",
  "status": "active|pending|deleted",
  "visibility": "public|private|friends",
  "author": {
    "id": "uuid",
    "fullName": "string",
    "email": "string",
    "avatarUrl": "string|null",
    "bio": "string|null"
  },
  "likeCount": 0,
  "commentCount": 0,
  "shareCount": 0,
  "isSavedByCurrentUser": false,
  "likeSummary": {
    "totalLikes": 0,
    "reactionCounts": {
      "like": 0,
      "love": 0,
      "haha": 0,
      "wow": 0,
      "sad": 0,
      "angry": 0
    },
    "currentUserReaction": "string|null",
    "topLikes": []
  },
  "topComments": [],
  "postMedias": [],
  "createdAt": "2026-05-01T10:30:00Z",
  "updatedAt": "2026-05-01T10:30:00Z"
}
```

### PaginatedResponse<T>

```json
{
  "data": [],
  "total": 0,
  "skip": 0,
  "take": 20,
  "totalPages": 0,
  "hasNextPage": false
}
```

### UserResponseDTO

```json
{
  "id": "uuid",
  "fullName": "string",
  "email": "string",
  "userName": "string",
  "avatarUrl": "string|null",
  "bio": "string|null",
  "phoneNumber": "string|null",
  "dateOfBirth": "2000-01-01",
  "isOnline": false,
  "lastSeen": "2026-05-01T10:30:00Z"
}
```

---

## ⚠️ Mã Lỗi

| Mã | Mô Tả |
|----|-------|
| 200 | OK - Yêu cầu thành công |
| 201 | Created - Tạo tài nguyên thành công |
| 204 | No Content - Xóa thành công |
| 400 | Bad Request - Dữ liệu yêu cầu không hợp lệ |
| 401 | Unauthorized - Không xác thực hoặc token hết hạn |
| 403 | Forbidden - Không có quyền truy cập |
| 404 | Not Found - Tài nguyên không tìm thấy |
| 409 | Conflict - Xung đột (ví dụ: bản ghi đã tồn tại) |
| 500 | Internal Server Error - Lỗi server |

### Cấu Trúc Lỗi

```json
{
  "error": "string",
  "message": "string",
  "statusCode": 400,
  "timestamp": "2026-05-01T10:30:00Z"
}
```

---

## 💡 Ví Dụ Sử Dụng

### Ví Dụ 1: Lấy Danh Sách Bài Viết và Lưu Bài Yêu Thích

**JavaScript/TypeScript:**
```javascript
const API_URL = "http://localhost:5000/api";
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

// Lấy danh sách bài viết
async function getPosts() {
  const response = await fetch(`${API_URL}/post?skip=0&take=20`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  return data;
}

// Lưu bài viết
async function savePost(postId) {
  const response = await fetch(`${API_URL}/post/${postId}/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data;
}

// Sử dụng
const posts = await getPosts();
console.log(posts);

// Lưu bài viết đầu tiên
if (posts.data.length > 0) {
  const savedPost = await savePost(posts.data[0].id);
  console.log("Bài viết đã lưu:", savedPost);
}
```

---

### Ví Dụ 2: Tìm Kiếm Người Dùng

**Python:**
```python
import requests

API_URL = "http://localhost:5000/api"
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Tìm kiếm người dùng
def search_users(query, skip=0, take=20):
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    params = {
        "q": query,
        "skip": skip,
        "take": take
    }
    response = requests.get(f"{API_URL}/user/search", headers=headers, params=params)
    return response.json()

# Sử dụng
results = search_users("nguyễn")
print(f"Tìm thấy {results['total']} người dùng")
for user in results['data']:
    print(f"- {user['fullName']} ({user['userName']})")
```

---

### Ví Dụ 3: Tạo Bài Viết Mới

**cURL:**
```bash
curl -X POST http://localhost:5000/api/post \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "content": "Xin chào mọi người!",
    "visibility": "public",
    "status": "active",
    "postMedias": [
      {
        "mediaUrl": "https://example.com/photo.jpg",
        "mediaType": "image"
      }
    ]
  }'
```

---

### Ví Dụ 4: Bình Luận Trên Bài Viết

**Axios (JavaScript):**
```javascript
import axios from 'axios';

const API_URL = "http://localhost:5000/api";
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

async function createComment(postId, content) {
  try {
    const response = await axios.post(
      `${API_URL}/comment`,
      {
        postId: postId,
        content: content,
        parentCommentId: null
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi khi tạo bình luận:", error.response.data);
  }
}

// Sử dụng
const postId = "123e4567-e89b-12d3-a456-426614174000";
const newComment = await createComment(postId, "Bài viết rất hay!");
console.log("Bình luận mới:", newComment);
```

---

## 🆘 Hỗ Trợ & Liên Hệ

Nếu bạn gặp vấn đề hoặc có câu hỏi về API:

- **Email**: support@interacthub.com
- **Website**: https://interacthub.com
- **GitHub Issues**: https://github.com/interacthub/api/issues
- **Discord**: https://discord.gg/interacthub

---

## 📝 Ghi Chú Quan Trọng

1. **Phân Trang**: Tất cả endpoint danh sách mặc định trả về 20 bản ghi nếu không chỉ định `take`
2. **Sắp Xếp**: Các bài viết được sắp xếp theo thời gian tạo mới nhất trước
3. **Lọc**: API chỉ trả về các bài viết `public` trong tìm kiếm
4. **Thông Báo**: Hệ thống tự động tạo thông báo khi có người thích/bình luận/chia sẻ bài viết của bạn
5. **Token Hết Hạn**: Nếu nhận được 401, hãy đăng nhập lại để lấy token mới

---

**Phiên Bản Tài Liệu**: 1.0  
**Cập Nhật Lần Cuối**: 01 Tháng 5, 2026  
**Tác Giả**: InteractHub Team
