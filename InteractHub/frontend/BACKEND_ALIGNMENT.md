# Frontend ↔ Backend Alignment — Thay đổi đã thực hiện

## Tổng quan
Frontend được chỉnh sửa để phối hợp chính xác với backend **InteractHub.Api** (.NET, chạy port 5073).

---

## 1. `vite.config.ts` — Thêm Proxy
```
/api/* → http://localhost:5073
```
Loại bỏ lỗi CORS khi dev. Không cần set `VITE_API_URL` khi chạy local.

---

## 2. `src/services/api.ts`
- `DEFAULT_BASE` để trống — Vite proxy xử lý khi dev.
- `withCredentials: false` — Backend dùng JWT Bearer, không phải cookie session.
- `unwrap<T>()` hỗ trợ cả `ApiResponse<T>.data` và direct response.

---

## 3. `src/services/authService.ts`
**Vấn đề cũ:** Frontend expect `{ token, user }` nhưng backend trả `{ success, message, token }`.

**Fix:**
- Map đúng response: lấy `token` từ `data.token`.
- Sau login → gọi `GET /api/auth/profile` để lấy thông tin user thực.
- Register payload: thêm `DateOfBirth` và `Gender` (bắt buộc theo `RegisterDTO` backend).

---

## 4. `src/contexts/AuthContext.tsx`
- Sau khi login/register, tự động gọi `authService.getMe()` để lấy profile đầy đủ.
- Khi app load, restore session từ `localStorage` + validate bằng `/api/auth/profile`.

---

## 5. `src/services/commentService.ts`
**Vấn đề cũ:** Route sai `/api/comment/pót/{postId}`.

**Fix:** Đổi thành `/api/comment/post/{postId}` đúng với `[HttpGet("post/{postId}")]` backend.

---

## 6. `src/services/likeService.ts`
**Vấn đề cũ:** `ToggleLikeDTO.type` là `string` (e.g. `"LIKE"`).

**Fix:** Đổi thành `enum LikeType` số nguyên (0=LIKE, 1=LOVE, ...) khớp backend C# enum.

---

## 7. `src/services/notificationService.ts`
**Vấn đề cũ:** Frontend expect `{ actor, message, timeAgo }` nhưng backend trả `{ content, type(số), isRead, userId }`.

**Fix:**
- `NotificationResponseDTO` khớp hoàn toàn backend.
- `CreateNotificationDTO` dùng `content` + `type` (số) + `userId` — không phải `message`/`actorId`.
- Thêm `mapFromBackend()` để convert sang DTO UI.
- Map `NotificationType` enum số → `NotifType` string cho UI.

---

## 8. `src/services/postService.ts`
**Vấn đề cũ:** `createPost` gửi `{ content, imageUrl }` nhưng backend cần `{ UserId, Content, Visibility (enum), MediaItems[] }`.

**Fix:**
- `createPost` nhận `userId` và gửi đúng cấu trúc.
- `mapFromBackend()` chuyển `BackendPostDto` → `PostDto` UI.
- `updatePost` dùng PascalCase fields.

---

## 9. `src/services/userService.ts`
**Vấn đề cũ:** Gọi `/api/user/me` không tồn tại trong backend.

**Fix:**
- `getMyProfile()` → `GET /api/auth/profile` (endpoint đúng).
- `getProfile(id)` → `GET /api/user/{id}` (Admin only — fallback mock nếu 403).
- `uploadAvatar()` → `POST /api/media/upload` với field `file`.
- `updateProfile()` → `PUT /api/user/{id}` với `UpdateUserDTO` format đúng.

---

## 10. `src/services/friendService.ts`
**Fix:**
- `sendFriendRequest` gửi `{ RequesterId, ReceiverId }` (PascalCase).
- Map `FriendshipResponseDTO` (có `requester`/`receiver` objects) thành `FriendDto` cho UI.

---

## 11. `src/services/messageService.ts` *(file mới)*
Frontend chưa có service này. Tạo mới với đầy đủ:
- `sendMessage` → `POST /api/message/send`
- `getConversation` → `GET /api/message/conversation/{otherUserId}`
- `getConversations` → `GET /api/message/conversations`
- `markAsRead` → `PUT /api/message/{id}/mark-as-read`
- `deleteMessage` → `DELETE /api/message/{id}`
- `getUnreadCount` → `GET /api/message/unread-count`

---

## 12. `src/pages/AuthPage.tsx`
- Login: dùng `authService.login()` thống nhất.
- Register: gửi đúng `dateOfBirth` và `gender` cho backend.
- Sau register thành công → chuyển về tab Login (vì backend register không auto-trả token).

---

## Hướng dẫn chạy

### Backend (.NET)
```bash
cd backend/InteractHub.Api
dotnet run
# Chạy ở http://localhost:5073
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
# Chạy ở http://localhost:5173
# /api/* được proxy tự động đến backend
```

### Password yêu cầu backend
Backend yêu cầu password: ≥8 ký tự, có chữ hoa, số, ký tự đặc biệt.
Ví dụ: `Admin@12345`
