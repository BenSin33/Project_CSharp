# 📋 InteractHub - End-to-End (E2E) Test Plan

Đây là danh sách toàn bộ các tính năng cần kiểm thử để đảm bảo hệ thống vận hành trơn tru trước khi bàn giao.

## 1. 🔐 Authentication & Security
- [ ] **Register:** Đăng ký tài khoản mới với các ràng buộc mật khẩu.
- [ ] **Login:** Đăng nhập thành công với tài khoản Admin và User.
- [ ] **Logout:** Đăng xuất xóa session và quay về trang Login.
- [ ] **Auth Guards:** Tài khoản User thường không thể vào `/admin`.
- [ ] **Token Expired:** Hệ thống tự động đẩy ra ngoài khi token hết hạn (nếu có).

## 2. 📰 Newsfeed & Post Operations
- [ ] **Create Post:**
    - [ ] Bài viết chỉ có văn bản.
    - [ ] Bài viết kèm hình ảnh (Upload lên Azure Blob).
    - [ ] Bài viết có Hashtag (Click vào hashtag ra danh sách liên quan).
- [ ] **Real-time Post:** Bài viết mới hiện ngay trên máy người khác mà không cần F5.
- [ ] **Interactions:**
    - [ ] **Like/Reaction:** Thả tim/Like bài viết.
    - [ ] **Comment:** Bình luận và hiển thị bình luận ngay lập tức.
    - [ ] **Delete Comment:** Xóa bình luận của chính mình.
    - [ ] **Share:** Chia sẻ bài viết thành một bài đăng mới.
    - [ ] **Bookmark/Save:** Lưu bài viết vào danh sách yêu thích.
- [ ] **Post Status:** Kiểm tra nhãn "HIDDEN BY ADMIN" hiển thị đúng khi bài bị ẩn.

## 3. 🎞️ Stories
- [ ] **Create Story:** Upload ảnh làm story mới.
- [ ] **Story Bar:** Hiển thị vòng tròn story của những người mình theo dõi.
- [ ] **View Story:** Click xem story với hiệu ứng chuyển ảnh.
- [ ] **Real-time Story:** Story mới tự động xuất hiện trên thanh bar.

## 4. 🤝 Social & Networking
- [ ] **Search:** Tìm kiếm người dùng qua tên hoặc email.
- [ ] **Friend Request:**
    - [ ] Gửi lời mời kết bạn.
    - [ ] Nhận thông báo (chấm đỏ) khi có lời mời.
    - [ ] Chấp nhận (Accept) / Từ chối (Decline) lời mời.
- [ ] **Unfriend:** Hủy kết bạn với một người đang là bạn bè.

## 5. 💬 Messaging & Chat
- [ ] **Real-time Chat:** Tin nhắn hiển thị tức thời ở cả 2 phía.
- [ ] **Unread Indicators:** Chấm đỏ báo hiệu tin nhắn mới chưa đọc ở Sidebar.
- [ ] **Conversation List:** Danh sách chat cập nhật nội dung tin nhắn mới nhất.
- [ ] **Avatar in Chat:** Hiển thị đúng ảnh đại diện người đang chat cùng.

## 6. 🔔 Notifications
- [ ] **Real-time Alerts:** Nhận thông báo khi có Like, Comment, Friend Request.
- [ ] **Notification Panel:** Danh sách thông báo đầy đủ, hiển thị thời gian (Time ago).
- [ ] **Mark Read:** Tính năng "Mark all as read" hoạt động chuẩn.

## 7. 👤 Profile & Settings
- [ ] **Profile View:** Xem tường nhà mình và người khác (hiển thị đúng bài viết).
- [ ] **Update Profile:** Đổi tên hiển thị, tiểu sử.
- [ ] **Avatar Upload:** Đổi ảnh đại diện, kiểm tra cập nhật Real-time trên toàn app.

## 8. 🛡️ Admin Dashboard
- [ ] **User Management:** Xem danh sách, khóa/mở khóa tài khoản người dùng.
- [ ] **Post Moderation:**
    - [ ] Ẩn bài viết vi phạm (Hide).
    - [ ] Hiện lại bài viết (Unhide).
- [ ] **Reports:** Xem danh sách các báo cáo vi phạm (nếu có).

## 9. 📱 UI/UX & Responsive
- [ ] **Responsive Design:** Kiểm tra trên giao diện điện thoại (Mobile) không bị vỡ khung.
- [ ] **Loading States:** Các hiệu ứng chờ khi đang fetch dữ liệu.
- [ ] **Empty States:** Hiển thị thông báo khi không có bài viết hoặc không có tin nhắn.
- [ ] **Blob Images:** Kiểm tra ảnh không bị die/expired (Clean URL verification).

---
*Cập nhật lần cuối: 13/05/2026 bởi Antigravity*
