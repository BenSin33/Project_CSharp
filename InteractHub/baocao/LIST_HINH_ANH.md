# Danh sách hình ảnh cần chuẩn bị cho Báo cáo InteractHub

Dưới đây là danh sách toàn bộ các file hình ảnh bạn cần có trong thư mục `baocao` để báo cáo Latex hiển thị đầy đủ và không bị lỗi.

## 1. Nhóm Sơ đồ & Kiến trúc (Diagrams)
*Các file này thường được vẽ bằng Draw.io hoặc xuất từ PlantUML.*

| Tên File | Mô tả nội dung | Trạng thái hiện tại |
| :--- | :--- | :--- |
| `hinh1.drawio.png` | Sơ đồ thực thể ERD (Database) | ✅ Đã có |
| `Use_Case_Diagram.png` | Sơ đồ Use Case tổng quan | ✅ Đã có |
| `Data_Flow_Diagram.png` | Sơ đồ luồng dữ liệu (DFD) | ✅ Đã có |
| `Sequence_Auth.png` | Sơ đồ tuần tự: Đăng nhập | ✅ Đã có |
| `Sequence_Post.png` | Sơ đồ tuần tự: Đăng bài viết | ✅ Đã có |
| `Sequence_Like_Noti.png` | Sơ đồ tuần tự: Like & Thông báo | ✅ Đã có |
| `Sequence_Friendship.png` | Sơ đồ tuần tự: Kết bạn | ✅ Đã có |
| `Sequence_Story.png` | Sơ đồ tuần tự: Story | ✅ Đã có |
| `Sequence_Admin.png` | Sơ đồ tuần tự: Quản trị & Thống kê | ✅ Đã có |
| `Sequence_Messaging.png` | Sơ đồ tuần tự: Nhắn tin real-time | ✅ Đã có |
| `Sequence_Report_Management.png` | Sơ đồ tuần tự: Xử lý Báo cáo | ✅ Đã có |
| `Sequence_User_Management.png` | Sơ đồ tuần tự: Quản lý người dùng | ✅ Đã có |
| `Sequence_Search.png` | Sơ đồ tuần tự: Tìm kiếm | ✅ Đã có |

---

## 2. Nhóm Ảnh chụp màn hình giao diện (Screenshots)
*Bạn cần chạy ứng dụng và chụp màn hình thực tế. Lưu ý đúng định dạng đuôi file (.png hoặc .jpg).*

| Tên File | Mô tả nội dung cần chụp | Định dạng |
| :--- | :--- | :--- |
| `Trangdangnhap.png` | Màn hình đăng nhập | .png |
| `GiaoDienDangKiTaiKhoan.jpg` | Màn hình đăng ký tài khoản | .jpg |
| `GiaoDienProfile.jpg` | Trang hồ sơ cá nhân | .jpg |
| `GiaoDienCaiDat_1.jpg` | Trang cài đặt thông tin / mật khẩu | .jpg |
| `GiaoDienTongQuanInteractHub.jpg` | Trang chủ (Newsfeed) | .jpg |
| `TaoBaiViet.jpg` | Giao diện khi đang soạn thảo bài viết mới | .jpg |
| `TaoStory.jpg` | Giao diện khi đang đăng tin (Story) | .jpg |
| `StoryCuaMotUser.jpg` | Giao diện khi đang xem Story của người khác | .jpg |
| `GiaoDienBookMarks.jpg` | Danh sách các bài viết đã lưu | .jpg |
| `GiaoDienExplore_1.jpg` | Trang khám phá (Hashtags, Trending) | .jpg |
| `TimKiem_1.jpg` | Kết quả tìm kiếm người dùng/bài viết | .jpg |
| `GiaoDienBanBe_1.jpg` | Danh sách bạn bè hoặc lời mời kết bạn | .jpg |
| `ThanhThongBao.jpg` | Menu thông báo đẩy (Notifications) | .jpg |
| `GiaoDienNhanTin.jpg` | Cửa sổ nhắn tin với một người dùng khác | .jpg |
| `GiaoDienAdminDashboard(Admin).jpg` | Trang chủ Dashboard dành cho Admin | .jpg |
| `GiaoDienQuanLyReport(Admin).jpg` | Trang Admin xem danh sách các báo cáo vi phạm | .jpg |

---

## 3. Nhóm Minh chứng Kỹ thuật (Technical Evidence)
*Chụp từ kết quả chạy lệnh hoặc công cụ phát triển.*

| Tên File | Mô tả nội dung cần chụp | Trạng thái |
| :--- | :--- | :--- |
| `KetQuaCICD.png` | Màn hình terminal chạy `docker build` thành công | ⏳ Cần chụp |
| `DevOps_CICD.png` | Màn hình tab **Actions** trên GitHub hiện các tích xanh | ⏳ Cần chụp |

---

**Lưu ý quan trọng:**
1. Hãy đảm bảo đặt tên file **chính xác từng ký tự** (kể cả chữ hoa chữ thường).
2. Kiểm tra đuôi file (ví dụ: `.jpg` khác với `.png`), nếu lưu sai đuôi file báo cáo sẽ không nhận diện được.
3. Sau khi bỏ ảnh vào thư mục `baocao`, bạn chỉ cần biên dịch lại file `.tex` là ảnh sẽ tự động hiện lên.
