# Hướng dẫn Triển khai (Deploy) InteractHub lên Azure (Dành cho Sinh viên - Hoàn toàn miễn phí)

Tài liệu này giải thích chi tiết cách đưa hệ thống InteractHub từ máy tính (Local) lên Azure bằng cách tận dụng tối đa các gói dịch vụ **MIỄN PHÍ** thuộc gói **Azure for Students**.

---

## 1. Kiến trúc Hệ thống Miễn phí trên Azure

Để tối ưu chi phí (không tốn đồng nào từ credit $100 của tài khoản Sinh viên), chúng ta sẽ sử dụng các dịch vụ sau:

1. **Frontend (React + Vite)**: 
   - Sử dụng **Azure Static Web Apps (Gói Free)**. Gói này miễn phí vĩnh viễn, hỗ trợ tự động build từ GitHub siêu nhanh và xịn sò cho các app React.
   - Frontend tương tác với Backend thông qua biến môi trường `VITE_API_URL`.

2. **Backend (ASP.NET Core API)**:
   - Sử dụng **Azure App Service (Gói F1 - Free)**. Gói này cho phép chạy app miễn phí với 60 phút compute mỗi ngày (Dư sức để sinh viên làm đồ án, nộp bài và demo).
   - Backend sẽ cung cấp API và giao tiếp với Database, Blob Storage.

3. **Database (SQL Server)**:
   - Sử dụng **Azure SQL Database (Gói Free Offer)**. Azure hiện tại đang cung cấp gói Database miễn phí (100,000 vCore seconds/tháng và 32GB dung lượng) rất thích hợp cho đồ án.
   - Nếu tài khoản không thấy gói Free này, bạn có thể chọn gói **Basic (DTU)** tốn khoảng $5/tháng (Sẽ trừ vào $100 credit sinh viên, vẫn không tốn tiền túi).

4. **Lưu trữ file (Azure Blob Storage)**:
   - Sử dụng **Azure Storage Account (Standard V2 - LRS)**. Azure miễn phí 5GB lưu trữ đầu tiên mỗi tháng, quá đủ để lưu trữ hình ảnh/avatar cho đồ án.

---

## 2. Các bước Setup & Deploy lên Azure (Free Tier)

### Bước 1: Khởi tạo Azure SQL Database (Gói Miễn phí)
1. Vào [Azure Portal](https://portal.azure.com/).
2. Tìm kiếm và chọn **Azure SQL** -> Nhấn **Create**.
3. Chọn **SQL databases** -> Nhấn **Create**.
4. Chọn Subscription là *Azure for Students*. 
5. Tại mục **Compute + storage**, nhấn *Configure database*.
6. TÌM KỸ mục **Apply this offer** (Nút gạt: *Apply Azure SQL Database Free Offer*). Bật nó lên để được dùng Database miễn phí! (Nếu không có, hãy chọn gói Basic rẻ nhất).
7. Đặt tên Server, tạo tài khoản Admin (User & Password). Nhớ lưu lại thông tin này!
8. Ở mục **Networking**:
   - Chọn *Public endpoint*.
   - Bật **Allow Azure services and resources to access this server** thành `Yes` (Rất quan trọng, để Backend của bạn gọi được DB).
   - Bật **Add current client IP address** thành `Yes` (Để bạn dùng SQL Server Management Studio/VS Code kết nối từ máy ảo/máy thật vào DB).
9. Tạo Database và copy lại `Connection string`.

### Bước 2: Triển khai Backend lên Azure App Service (Gói F1 Free)
Bạn sử dụng tiện ích mở rộng (Extension) của Visual Studio Code để deploy trực tiếp.

1. Trong VS Code, cài đặt Extension **Azure App Service**. Đăng nhập tài khoản sinh viên của bạn.
2. Nhấn chuột phải vào thư mục `backend/InteractHub.Api` -> chọn **Deploy to Web App...**
3. Chọn **Create new Web App (Advanced)**.
4. Chọn thông tin như sau:
   - Tên App: `interacthub-api-123` (tên tùy chọn, phải viết liền không dấu, không trùng với người khác).
   - Publish: `Code`.
   - Runtime stack: `.NET 6 (LTS)` (hoặc phiên bản bạn đang dùng).
   - OS: **Windows** hoặc **Linux** (Khuyên dùng Windows cho .NET dễ tương thích gói Free).
   - App Service Plan: Tạo một gói mới và bắt buộc chọn **F1 - Free** (Miễn phí hoàn toàn).
5. Đợi quá trình Upload và Deploy hoàn tất.
6. **Cấu hình Biến môi trường (Environment Variables) cho Backend:**
   - Lên Azure Portal -> App Services -> Chọn Backend App vừa tạo -> **Settings** -> **Environment variables**.
   - Nhấn **Add** để thêm các thông tin bảo mật (giống `appsettings.json`):
     - `ConnectionStrings:DefaultConnection` = *<Connection string Azure SQL ở Bước 1>*
     - `ConnectionStrings:AzureBlobStorage` = *<Connection string của Azure Blob Storage>*
     - `Jwt:Key` = *<Một chuỗi bí mật ngẫu nhiên dài hơn 32 ký tự>*
   - Nhấn **Apply** và **Save**.
7. **Cấu hình CORS (Để Frontend gọi được API):**
   - Vẫn ở Backend App -> mục **CORS** (bên menu trái).
   - Tạm thời gõ dấu `*` để cho phép tất cả các nguồn truy cập (hoặc sau khi deploy Frontend ở Bước 3 xong thì quay lại đây dán URL của Frontend vào).
   - Tích chọn `Enable Access-Control-Allow-Credentials`. Save lại.

### Bước 3: Triển khai Frontend lên Azure Static Web Apps (Miễn phí 100%)
Gói này yêu cầu source code Frontend của bạn phải nằm trên **GitHub**.

1. Cài đặt Extension **Azure Static Web Apps** trong VS Code.
2. Đăng nhập và nhấn biểu tượng dấu `+` để **Create Static Web App**.
3. Chọn Repository GitHub chứa dự án của bạn (Nhớ commit & push code lên GitHub trước nhé).
4. Các cấu hình khi VS Code hỏi:
   - **Build Preset**: `React`.
   - **App location**: `frontend` (Thư mục chứa mã nguồn React của bạn, nơi chứa `package.json`).
   - **Api location**: Xóa đi, để trống.
   - **Output location**: `dist`.
5. Azure sẽ tự động tạo một file YAML trên GitHub Actions để chạy tiến trình Build. Bạn có thể mở GitHub Repo của mình, vào tab **Actions** để xem nó đang chạy.
6. **Sửa VITE_API_URL:**
   - Vào Azure Portal -> Tìm **Static Web Apps** -> Chọn App Frontend bạn vừa tạo.
   - Bên menu trái, chọn **Environment variables**.
   - Thêm biến mới:
     - Tên: `VITE_API_URL`
     - Giá trị: `https://<tên-app-backend-của-bạn>.azurewebsites.net` (Đường link của Backend App Service ở Bước 2).
   - Nhấn Save.
7. Khi GitHub Actions báo màu xanh (Success), bạn sẽ thấy URL của Frontend (ví dụ `https://calm-ocean-1234.azurestaticapps.net`). Bấm vào đó để trải nghiệm trang web của bạn!

---

## 3. Tóm tắt luồng hoạt động khi mọi thứ đã trên Azure

1. Khi giảng viên chấm bài, họ truy cập URL Frontend (được cấp bởi Azure Static Web Apps). Frontend lúc này chỉ là các file tĩnh HTML/JS/CSS được tải xuống trình duyệt của giảng viên.
2. Tại trình duyệt, Frontend sẽ gọi API thông qua biến môi trường `VITE_API_URL` tới Backend (Azure App Service).
3. Backend nhận request, dùng sức mạnh tính toán của gói F1 Free để xử lý logic, đồng thời kết nối bằng `DefaultConnection` tới Azure SQL Database (Gói Free) để lấy/lưu dữ liệu.
4. Khi người dùng (hoặc giảng viên) đăng bài có hình ảnh, Backend sẽ dùng `AzureBlobStorage` connection string đẩy hình lên Blob Storage và lưu link ảnh trực tiếp vào SQL Database. Lúc tải bảng Feed, ảnh sẽ được load thẳng từ Azure Storage cực kì mượt mà!

---

### Một số Lỗi thường gặp (Dành cho Sinh viên)
- **Lỗi hết dung lượng bộ nhớ / CPU**: Vì gói F1 Free của Backend chỉ cho phép 60 phút chạy tính toán mỗi ngày. Nếu bạn hoặc ai đó f5 trang quá nhiều, App Service có thể bị tạm ngưng đến ngày hôm sau. Khuyên dùng lúc chuẩn bị demo hãy bật lên.
- **Lỗi 500 khi gọi API lần đầu**: Thường là do Backend chưa kết nối được DB. Đừng quên vào DB trên Portal, bật **Allow Azure services and resources to access this server**!
- **Frontend không gọi được API**: Lỗi CORS kinh điển. Bạn nhớ vào mục CORS của Backend và thêm chính xác đường link Frontend (Ví dụ `https://calm-ocean-1234.azurestaticapps.net`, KHÔNG CÓ DẤU `/` ở cuối).
