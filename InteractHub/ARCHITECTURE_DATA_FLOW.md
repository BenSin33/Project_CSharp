# 🏗️ InteractHub - Kiến trúc Luồng Dữ liệu & JWT

Tài liệu này giải thích cách dữ liệu di chuyển trong hệ thống, cơ chế bảo mật bằng JWT và quy trình phát triển.

---

## 1. 🔄 Luồng Dữ liệu (Data Flow)

Luồng đi của một yêu cầu từ người dùng đến khi nhận được kết quả:

### 🌐 Frontend (React)
1. **User Action**: Người dùng click (ví dụ: Đăng bài).
2. **Component**: React Component gọi một hàm trong `service` (ví dụ: `postService.createPost`).
3. **Axios Instance**: Request đi qua `api.ts`.
   - **Interceptor**: Tự động lấy JWT từ `localStorage` và gắn vào Header: `Authorization: Bearer <token>`.
4. **Network**: Request gửi đến Backend API.

### ⚙️ Backend (.NET API)
5. **Middleware**: 
   - **Authentication Middleware**: Kiểm tra xem Header có Token hợp lệ không (chưa hết hạn, đúng chữ ký).
   - **Authorization Middleware**: Kiểm tra quyền (ví dụ: `/admin` chỉ dành cho Role `Admin`).
6. **Controller**: Tiếp nhận dữ liệu từ Request (Body, Query, Params).
7. **Service**: Xử lý logic nghiệp vụ (Kiểm tra nội dung, xử lý ảnh...).
8. **Repository**: Giao tiếp với cơ sở dữ liệu (sử dụng **Entity Framework Core** hoặc **Dapper**).
9. **Database**: SQL Server thực hiện lưu trữ/truy vấn.

### 📩 Response Flow
- Dữ liệu quay ngược lại: `DB -> Repository -> Service -> Controller`.
- Controller đóng gói kết quả vào `ApiResponseDTO` (success, message, data).
- Frontend nhận kết quả, cập nhật State (React Hook) và UI thay đổi.

---

## 2. 🔐 Cơ chế JWT (JSON Web Token)

### 🛠️ Tạo Token (Backend - AuthService)
- Khi đăng nhập thành công, `AuthService.GenerateJwtTokenAsync` được gọi.
- **Claims**: Lưu thông tin cơ bản: `UserId`, `Email`, `Jti` (Unique ID), và quan trọng nhất là `Role` (User/Admin).
- **Signing Key**: Token được ký bằng một mã bí mật (`Jwt:Key`) để đảm bảo không bị giả mạo.
- **Expiration**: Token có thời hạn (thường là 1 giờ).

### 💾 Lưu trữ Token (Frontend)
- Sau khi `api/auth/login` trả về token, Frontend lưu vào **`localStorage`**:
  ```javascript
  localStorage.setItem("token", data.token);
  ```

### 🔍 Kiểm tra Token (Backend - Program.cs)
- Cấu hình trong `AddJwtBearer`:
  - `ValidateIssuer`: Kiểm tra nguồn phát hành.
  - `ValidateAudience`: Kiểm tra đối tượng sử dụng.
  - `ValidateLifetime`: Kiểm tra xem token còn hạn không.
  - `ValidateIssuerSigningKey`: Kiểm tra tính hợp lệ của chữ ký.

---

## 3. 🧪 Quy trình & Công nghệ Kiểm thử

| Loại kiểm thử | Công cụ sử dụng | Mục tiêu |
| :--- | :--- | :--- |
| **Unit Test** | xUnit, Moq | Kiểm tra logic của từng hàm/service riêng biệt ở Backend. |
| **API Test** | Swagger UI, Postman | Kiểm tra các Endpoint có trả về đúng JSON và Status Code không. |
| **E2E Test** | Browser Tool, Playwright | Giả lập người dùng thật: Login -> Đăng bài -> Logout. |
| **Real-time Test** | SignalR Logs | Kiểm tra tin nhắn và thông báo có hiện ngay lập tức không. |

---

## ❓ Giải đáp các câu hỏi (Workflow & Callback)

### 🔹 Frontend Workflow
- Sử dụng **Functional Components** và **React Hooks** (`useState`, `useEffect`, `useContext`).
- Quản lý trạng thái đăng nhập tập trung tại `AuthContext.tsx`.

### 🔹 Backend Functions
- Các hàm được viết theo nguyên tắc **Dependency Injection** (DI).
- Sử dụng **Async/Await** để tối ưu hiệu năng xử lý song song.

### 🔹 Callbacks & Async
- **Frontend**: Sử dụng `Promise` (`.then()`, `.catch()`) hoặc `async/await` để xử lý các yêu cầu bất đồng bộ từ API.
- **Real-time (SignalR)**: Sử dụng các `Hub` để gửi dữ liệu "Push" từ server xuống client mà không cần client hỏi (Callback từ server).
- **Backend**: Sử dụng `Task` để xử lý các tác vụ tốn thời gian mà không làm nghẽn luồng chính.

---

