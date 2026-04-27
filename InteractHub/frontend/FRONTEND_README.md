# FRONTEND Notes 



## Tổng quan thay đổi
1. Thêm HTTP client chung `src/services/api.ts`:
   - Sử dụng axios với `baseURL` mặc định `http://localhost:5073`.
   - Biến môi trường `VITE_API_BASE_URL` có thể override.
   - Interceptor tự động gắn JWT token từ `localStorage` vào header `Authorization`.
   - Hàm `unwrap(resp)` để lấy payload thực từ `ApiResponse<T>` của backend.

2. Authentication (AuthPage):
   - `src/pages/AuthPage.tsx` đã gọi `POST /api/auth/login` và `POST /api/auth/register`.
   - Lưu token JWT vào `localStorage` nếu backend trả token.
   - Thêm thông báo lỗi (server message) khi login/register thất bại.

3. Notifications:
   - `src/hooks/useNotification.tsx` đã đổi từ mock sang gọi `GET /api/notifications?skip=0&take=20`.
   - Thêm `markAllRead` gọi `PUT /api/notifications/mark-all-read`.
   - Map response sang `Notification` type frontend (fallback nhẹ nếu format khác).

4. Posts:
   - `src/services/postService.ts` (mới) — get/create/update/delete posts.
   - `src/pages/HomePage.tsx` đã load posts từ backend và render danh sách.
   - Mapping `PostResponseDto` -> `PostData` hiện là sơ bộ (author và counts tạm thời).

5. Likes:
   - `src/services/likeService.ts` (mới) — `getLikeSummary`, `toggleLike`.
   - `PostCard` gọi handler `onLike` (optimistic update xử lý trong component).

6. Comments:
   - `src/services/commentService.ts` (mới) — `getCommentsByPost`, `addComment`, `deleteComment`.
   - Ghi chú: backend hiện có route `GET /api/comment/pót/{postId}` (giữ nguyên trong service).

7. UI/UX: `src/components/post/PostCard.tsx`:
   - Thêm trạng thái loading cho like/comment.
   - Implement optimistic update cho like và add comment; nếu lỗi thì revert.
   - Hiển thị spinner và error message nhỏ trên card.

## Ghi chú quan trọng 
- Backend trả `ApiResponse<T>` ở nhiều endpoint. Hàm `unwrap(resp)` cố gắng trích `resp.data.data` nếu có, hoặc `resp.data`.
- Nhiều mapping data frontend hiện còn tạm (ví dụ: author name, like/share/comment counts). Khi backend cung cấp trường chi tiết hơn, hãy cập nhật mapping ở `HomePage` hoặc viết một mapper chung.
- Nếu backend chạy trên port khác, set `VITE_API_BASE_URL` (ví dụ trong `.env`) hoặc cập nhật `api.ts`.
- Một số endpoint yêu cầu xác thực (token). Đăng nhập trước để có token và gọi API thành công.

## Tiếp theo (gợi ý)
- Chuyển sang React Query để có caching, background refetch và hỗ trợ optimistic updates chuẩn.
- Hoàn thiện DTO types trên frontend theo DTO backend (type-safe).
- Thêm skeleton loading, pagination và error banner toàn cục.

---

Chi tiết file đã chỉnh sửa:
- src/services/api.ts (mới)
- src/services/postService.ts (mới)
- src/services/likeService.ts (mới)
- src/services/commentService.ts (mới)
- src/hooks/useNotification.tsx (cập nhật)
- src/pages/AuthPage.tsx (cập nhật)
- src/pages/HomePage.tsx (cập nhật)
- src/components/post/PostCard.tsx (cập nhật)

## Change log

### 2026-04-27

- Thêm HTTP client chung `src/services/api.ts` và helper `unwrap` để tương thích với `ApiResponse<T>` từ backend.
- Kết nối trang đăng nhập/đăng ký (`src/pages/AuthPage.tsx`) với API backend: gọi `POST /api/auth/login` và `POST /api/auth/register`, lưu token JWT vào `localStorage` khi có.
- Thay mock notifications bằng gọi thật trong `src/hooks/useNotification.tsx` (GET `/api/notifications`, PUT `/api/notifications/mark-all-read`).
- Thêm service cho posts `src/services/postService.ts` (CRUD) và tích hợp vào `src/pages/HomePage.tsx` để tải danh sách bài viết từ backend.
- Thêm service cho likes `src/services/likeService.ts` và cho comments `src/services/commentService.ts`.
- Cập nhật `src/components/post/PostCard.tsx` để hỗ trợ:
  - optimistic updates cho Like và Add Comment
  - hiển thị trạng thái loading (spinner / "Posting...")
  - revert thay đổi và hiển thị lỗi nếu API trả lỗi
- Cập nhật `src/pages/HomePage.tsx` để gọi `getAllPosts`, `toggleLike` và `addComment` từ các service mới.

Ghi chú ngắn (VN): Các mapping dữ liệu (author, counts) hiện là sơ bộ — cần hoàn thiện khi backend trả thêm thông tin (author, likes/shares/comments counts, media URLs).


