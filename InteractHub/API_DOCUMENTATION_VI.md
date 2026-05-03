# 📚 Tài Liệu API InteractHub - Phiên Bản Tiếng Việt

## 📋 Mục Lục
1. [Giới Thiệu](#giới-thiệu)
2. [Xác Thực & Phân Quyền](#xác-thực--phân-quyền)
3. [Cấu Hình Cơ Bản](#cấu-hình-cơ-bản)
4. [Endpoints API](#endpoints-api)
   - [Bình Luận (Comment)](#-bình-luận-comment)
   - [Lượt Thích (Like)](#️-lượt-thích-like)
   - [Chia Sẻ (Share)](#-chia-sẻ-share)
   - [Bài Viết (Post)](#-bài-viết-post)
   - [Bài Viết Đã Lưu (Saved Posts)](#-bài-viết-đã-lưu-saved-posts)
   - [Người Dùng (User)](#-người-dùng-user)
   - [Tin Nhắn (Message)](#-tin-nhắn-message)
   - [Thông Báo (Notification)](#-thông-báo-notification)
   - [Bạnhoa (Friendship)](#-bạnhoa-friendship)
   - [Cập Nhật (Story)](#-cập-nhật-story)
   - [**Báo Cáo (Report)**](#-báo-cáo-bình-luận-report---admin--user)
   - [**Dashboard Admin**](#-dashboard-admin-admin-dashboard)
   - [**Quản Lý Nội Dung**](#️-quản-lý-nội-dung-admin-post-management)
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

### 🚨 BÁO CÁO BÌNH LUẬN (Report) - *Admin & User*

#### Người Dùng Báo Cáo Bài Viết

```http
POST /api/report
Authorization: Bearer {token}
Content-Type: application/json

{
  "postId": "123e4567-e89b-12d3-a456-426614174000",
  "reason": "Nội dung không phù hợp",
  "reportType": "inappropriate"
}
```

**Phản hồi (201 Created):**
```json
{
  "id": "e23e4567-e89b-12d3-a456-426614174000",
  "postId": "123e4567-e89b-12d3-a456-426614174000",
  "reporterId": "223e4567-e89b-12d3-a456-426614174000",
  "reason": "Nội dung không phù hợp",
  "reportType": "inappropriate",
  "status": "pending",
  "createdAt": "2026-05-01T10:30:00Z"
}
```

---

#### Admin: Lấy Tất Cả Báo Cáo

```http
GET /api/report?skip=0&take=20&status=pending
Authorization: Bearer {admin_token}
```

**Tham số Query:**
| Tham số | Bắt buộc | Kiểu | Mô Tả |
|--------|---------|------|-------|
| `skip` | ❌ | int | Số bản ghi bỏ qua (mặc định: 0) |
| `take` | ❌ | int | Số bản ghi lấy (mặc định: 20) |
| `status` | ❌ | string | Lọc: pending, reviewed, resolved |

**Phản hồi (200 OK):**
```json
{
  "data": [
    {
      "id": "e23e4567-e89b-12d3-a456-426614174000",
      "postId": "123e4567-e89b-12d3-a456-426614174000",
      "post": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "content": "Nội dung bài viết...",
        "author": {
          "id": "223e4567-e89b-12d3-a456-426614174000",
          "fullName": "Nguyễn Văn A"
        }
      },
      "reporter": {
        "id": "323e4567-e89b-12d3-a456-426614174000",
        "fullName": "Trần Thị B"
      },
      "reason": "Nội dung không phù hợp",
      "reportType": "inappropriate",
      "status": "pending",
      "adminNotes": null,
      "createdAt": "2026-05-01T10:30:00Z"
    }
  ],
  "total": 45,
  "pendingCount": 15,
  "reviewedCount": 20,
  "resolvedCount": 10,
  "skip": 0,
  "take": 20
}
```

---

#### Admin: Cập Nhật Trạng Thái Báo Cáo

```http
PUT /api/report/{id}/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "reviewed",
  "adminNotes": "Bài viết vi phạm chính sách. Sẽ ẩn bài."
}
```

**Phản hồi (200 OK):**
```json
{
  "success": true,
  "message": "Cập nhật trạng thái báo cáo thành công"
}
```

---

#### Admin: Lấy Thống Kê Báo Cáo

```http
GET /api/report/stats/summary
Authorization: Bearer {admin_token}
```

**Phản hồi (200 OK):**
```json
{
  "pending": 15,
  "reviewed": 25,
  "resolved": 50,
  "total": 90
}
```

---

#### Admin: Lấy Top Bài Viết Bị Báo Cáo Nhiều Nhất

```http
GET /api/report/top-reported?count=10
Authorization: Bearer {admin_token}
```

**Phản hồi (200 OK):**
```json
[
  {
    "postId": "123e4567-e89b-12d3-a456-426614174000",
    "authorName": "Nguyễn Văn A",
    "content": "Nội dung bài viết...",
    "reportCount": 25,
    "lastReportedAt": "2026-05-01T10:30:00Z"
  }
]
```

---

### 📊 DASHBOARD ADMIN (Admin Dashboard)

#### Admin: Lấy Dashboard Đầy Đủ

```http
GET /api/admin/dashboard
Authorization: Bearer {admin_token}
```

**Phản hồi (200 OK):**
```json
{
  "stats": {
    "userStats": {
      "totalUsers": 1500,
      "newUsersThisMonth": 150,
      "activeUsersThisMonth": 800,
      "lockedUsers": 5
    },
    "postStats": {
      "totalPosts": 5000,
      "newPostsThisMonth": 500,
      "deletedPostsThisMonth": 25,
      "hiddenPostsThisMonth": 10
    },
    "reportStats": {
      "pendingReports": 12,
      "reviewedReports": 45,
      "resolvedReports": 80
    },
    "engagementStats": {
      "totalComments": 15000,
      "totalLikes": 50000,
      "totalShares": 3000
    }
  },
  "recentActivities": [
    {
      "type": "new_post",
      "description": "Nguyễn Văn A đã tạo bài viết mới",
      "timestamp": "2026-05-01T10:30:00Z",
      "relatedUserIds": ["223e4567-e89b-12d3-a456-426614174000"]
    },
    {
      "type": "new_report",
      "description": "Có báo cáo mới về bài viết",
      "timestamp": "2026-05-01T10:25:00Z",
      "relatedPostIds": ["123e4567-e89b-12d3-a456-426614174000"]
    }
  ],
  "pendingActions": [
    {
      "actionType": "report_review",
      "priority": 1,
      "title": "Xử lý báo cáo",
      "description": "Có 12 báo cáo chờ xử lý"
    },
    {
      "actionType": "locked_user",
      "priority": 2,
      "title": "Kiểm tra người dùng bị khóa",
      "description": "5 người dùng bị khóa"
    }
  ]
}
```

---

#### Admin: Lấy Thống Kê Dashboard

```http
GET /api/admin/dashboard/stats
Authorization: Bearer {admin_token}
```

**Phản hồi (200 OK):**
```json
{
  "userStats": {
    "totalUsers": 1500,
    "newUsersThisMonth": 150,
    "activeUsersThisMonth": 800,
    "lockedUsers": 5
  },
  "postStats": {
    "totalPosts": 5000,
    "newPostsThisMonth": 500,
    "deletedPostsThisMonth": 25,
    "hiddenPostsThisMonth": 10
  }
}
```

---

#### Admin: Lấy Hoạt Động Gần Đây

```http
GET /api/admin/dashboard/recent-activity?count=20
Authorization: Bearer {admin_token}
```

**Phản hồi (200 OK):**
```json
[
  {
    "type": "new_post",
    "description": "Nguyễn Văn A đã tạo bài viết mới",
    "timestamp": "2026-05-01T10:30:00Z"
  }
]
```

---

#### Admin: Lấy Các Hành Động Chờ Xử Lý

```http
GET /api/admin/dashboard/pending-actions
Authorization: Bearer {admin_token}
```

**Phản hồi (200 OK):**
```json
[
  {
    "actionType": "report_review",
    "priority": 1,
    "title": "Xử lý báo cáo",
    "description": "Có 12 báo cáo chờ xử lý"
  }
]
```

---

#### Admin: Lấy Tóm Tắt Hoạt Động Người Dùng

```http
GET /api/admin/dashboard/user-activity
Authorization: Bearer {admin_token}
```

**Phản hồi (200 OK):**
```json
{
  "todayPostsCount": 50,
  "thisWeekPostsCount": 350,
  "thisMonthPostsCount": 1500,
  "averagePostsPerUser": 3.33,
  "todayActiveUsers": 200,
  "thisWeekActiveUsers": 800
}
```

---

#### Admin: Kiểm Tra Sức Khỏe Hệ Thống

```http
GET /api/admin/dashboard/health
Authorization: Bearer {admin_token}
```

**Phản hồi (200 OK):**
```json
{
  "activeConnections": 450,
  "diskUsagePercent": 65,
  "memoryUsagePercent": 72,
  "databasePoolConnections": 20,
  "lastBackupTime": "2026-05-01T02:00:00Z"
}
```

---

### 🛡️ QUẢN LÝ NỘI DUNG (Admin Post Management)

#### Admin: Lấy Chi Tiết Bài Viết (Chế Độ Xem Admin)

```http
GET /api/admin/posts/{id}
Authorization: Bearer {admin_token}
```

**Phản hồi (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "content": "Nội dung bài viết",
  "status": "active",
  "visibility": "public",
  "author": {
    "id": "223e4567-e89b-12d3-a456-426614174000",
    "fullName": "Nguyễn Văn A",
    "email": "user@example.com"
  },
  "commentCount": 25,
  "likeCount": 150,
  "shareCount": 10,
  "reportCount": 3,
  "reportReasons": ["inappropriate", "spam"],
  "createdAt": "2026-05-01T08:00:00Z",
  "updatedAt": "2026-05-01T08:00:00Z"
}
```

---

#### Admin: Xóa Bài Viết

```http
DELETE /api/admin/posts/{id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "reason": "Vi phạm chính sách nội dung",
  "adminNotes": "Chứa nội dung không phù hợp"
}
```

**Phản hồi (200 OK):**
```json
{
  "success": true,
  "message": "Bài viết đã được xóa thành công"
}
```

---

#### Admin: Ẩn Bài Viết

```http
POST /api/admin/posts/{id}/hide
Authorization: Bearer {admin_token}
Content-Type: application/json

"Vi phạm chính sách cộng đồng"
```

**Phản hồi (200 OK):**
```json
{
  "success": true,
  "message": "Bài viết đã được ẩn thành công"
}
```

---

#### Admin: Hiện Bài Viết (Bỏ Ẩn)

```http
POST /api/admin/posts/{id}/unhide
Authorization: Bearer {admin_token}
```

**Phản hồi (200 OK):**
```json
{
  "success": true,
  "message": "Bài viết đã được hiện thành công"
}
```

---

#### Admin: Cập Nhật Visibility Bài Viết

```http
PUT /api/admin/posts/{id}/visibility
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "newVisibility": "private",
  "adminNotes": "Thay đổi từ public thành private"
}
```

**Phản hồi (200 OK):**
```json
{
  "success": true,
  "message": "Visibility bài viết đã được cập nhật thành công"
}
```

---

#### Admin: Lấy Danh Sách Bài Viết Bị Báo Cáo

```http
GET /api/admin/posts/reported?skip=0&take=20
Authorization: Bearer {admin_token}
```

**Phản hồi (200 OK):**
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "content": "Nội dung bài viết",
      "reportCount": 5,
      "author": {
        "id": "223e4567-e89b-12d3-a456-426614174000",
        "fullName": "Nguyễn Văn A"
      }
    }
  ],
  "total": 35,
  "skip": 0,
  "take": 20,
  "totalPages": 2,
  "hasNextPage": true
}
```

---

#### Admin: Lấy Bài Viết Của Một Người Dùng

```http
GET /api/admin/posts/user/{userId}?skip=0&take=20
Authorization: Bearer {admin_token}
```

**Phản hồi (200 OK):**
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "content": "Nội dung bài viết",
      "status": "active",
      "createdAt": "2026-05-01T08:00:00Z"
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

#### Admin: Thao Tác Hàng Loạt Trên Bài Viết

```http
POST /api/admin/posts/bulk-action
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "postIds": [
    "123e4567-e89b-12d3-a456-426614174000",
    "223e4567-e89b-12d3-a456-426614174000"
  ],
  "action": "hide",
  "reason": "Vi phạm chính sách",
  "adminNotes": "Nội dung không phù hợp"
}
```

**Phản hồi (200 OK):**
```json
{
  "success": 2,
  "failed": 0,
  "total": 2,
  "message": "Bulk action completed: 2 succeeded, 0 failed"
}
```

---

#### Admin: Tìm Kiếm Bài Viết

```http
GET /api/admin/posts/search?query=lập trình&skip=0&take=20
Authorization: Bearer {admin_token}
```

**Phản hồi (200 OK):**
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "content": "Nội dung về lập trình",
      "author": {
        "fullName": "Nguyễn Văn A"
      }
    }
  ],
  "total": 25,
  "skip": 0,
  "take": 20,
  "totalPages": 2,
  "hasNextPage": true
}
```

---

#### Admin: Lấy Bài Viết Chờ Xét Duyệt

```http
GET /api/admin/posts/pending-review
Authorization: Bearer {admin_token}
```

**Phản hồi (200 OK):**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "content": "Nội dung bài viết",
    "reportCount": 3,
    "author": {
      "fullName": "Nguyễn Văn A"
    },
    "createdAt": "2026-05-01T08:00:00Z"
  }
]
```

---

#### Admin: Xóa Bình Luận

```http
DELETE /api/admin/posts/comments/{commentId}
Authorization: Bearer {admin_token}
Content-Type: application/json

"Nội dung bình luận không phù hợp"
```

**Phản hồi (200 OK):**
```json
{
  "success": true,
  "message": "Bình luận đã được xóa thành công"
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

### Ví Dụ 5: Admin Báo Cáo Quản Lý - Lấy Dashboard

**JavaScript/TypeScript:**
```javascript
import axios from 'axios';

const API_URL = "http://localhost:5000/api";
const adminToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."; // Admin token

// Lấy Dashboard Admin
async function getAdminDashboard() {
  try {
    const response = await axios.get(
      `${API_URL}/admin/dashboard`,
      {
        headers: {
          "Authorization": `Bearer ${adminToken}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy dashboard:", error.response.data);
  }
}

// Sử dụng
const dashboard = await getAdminDashboard();
console.log("Thống kê người dùng:", dashboard.stats.userStats);
console.log("Báo cáo chờ xử lý:", dashboard.pendingActions);
console.log("Hoạt động gần đây:", dashboard.recentActivities);
```

---

### Ví Dụ 6: Admin Xử Lý Báo Cáo

**Python:**
```python
import requests

API_URL = "http://localhost:5000/api"
admin_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Lấy danh sách báo cáo chờ xử lý
def get_pending_reports(skip=0, take=20):
    headers = {
        "Authorization": f"Bearer {admin_token}"
    }
    params = {
        "skip": skip,
        "take": take,
        "status": "pending"
    }
    response = requests.get(f"{API_URL}/report", headers=headers, params=params)
    return response.json()

# Cập nhật trạng thái báo cáo
def update_report_status(report_id, status, admin_notes):
    headers = {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }
    data = {
        "status": status,
        "adminNotes": admin_notes
    }
    response = requests.put(
        f"{API_URL}/report/{report_id}/status",
        headers=headers,
        json=data
    )
    return response.json()

# Sử dụng
reports = get_pending_reports()
print(f"Có {reports['pendingCount']} báo cáo chờ xử lý")

if reports['data']:
    report = reports['data'][0]
    result = update_report_status(
        report['id'],
        "reviewed",
        "Bài viết vi phạm chính sách. Sẽ ẩn bài."
    )
    print("Báo cáo đã được cập nhật:", result)
```

---

### Ví Dụ 7: Admin Quản Lý Nội Dung - Ẩn/Xóa Bài Viết

**cURL:**
```bash
# Ẩn bài viết
curl -X POST http://localhost:5000/api/admin/posts/{postId}/hide \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '"Nội dung vi phạm chính sách cộng đồng"'

# Xóa bài viết
curl -X DELETE http://localhost:5000/api/admin/posts/{postId} \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Nội dung không phù hợp",
    "adminNotes": "Chứa spam và quảng cáo"
  }'

# Thao tác hàng loạt - Ẩn nhiều bài viết
curl -X POST http://localhost:5000/api/admin/posts/bulk-action \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "postIds": [
      "123e4567-e89b-12d3-a456-426614174000",
      "223e4567-e89b-12d3-a456-426614174000"
    ],
    "action": "hide",
    "reason": "Spam",
    "adminNotes": "Bài viết spam"
  }'
```

---

### Ví Dụ 8: Admin Tìm Kiếm và Xem Bài Viết Chờ Xét Duyệt

**JavaScript/TypeScript:**
```javascript
const API_URL = "http://localhost:5000/api";
const adminToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

// Tìm kiếm bài viết
async function searchPosts(query, skip = 0, take = 20) {
  try {
    const response = await fetch(
      `${API_URL}/admin/posts/search?query=${encodeURIComponent(query)}&skip=${skip}&take=${take}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${adminToken}`
        }
      }
    );
    return await response.json();
  } catch (error) {
    console.error("Lỗi khi tìm kiếm:", error);
  }
}

// Lấy bài viết chờ xét duyệt
async function getPendingReviewPosts() {
  try {
    const response = await fetch(
      `${API_URL}/admin/posts/pending-review`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${adminToken}`
        }
      }
    );
    return await response.json();
  } catch (error) {
    console.error("Lỗi khi lấy bài viết chờ xét duyệt:", error);
  }
}

// Sử dụng
const searchResults = await searchPosts("spam");
console.log(`Tìm thấy ${searchResults.total} bài viết chứa từ "spam"`);

const pendingPosts = await getPendingReviewPosts();
console.log(`Có ${pendingPosts.length} bài viết chờ xét duyệt`);

// Xem chi tiết từng bài viết
pendingPosts.forEach(post => {
  console.log(`\nBài viết ID: ${post.id}`);
  console.log(`Tác giả: ${post.author.fullName}`);
  console.log(`Số báo cáo: ${post.reportCount}`);
  console.log(`Nội dung: ${post.content.substring(0, 100)}...`);
});
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
