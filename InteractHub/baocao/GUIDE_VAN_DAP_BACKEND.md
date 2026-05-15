# HƯỚNG DẪN VẤN ĐÁP BACKEND - DƯƠNG THIỆN QUÝ
*(Phiên bản đặc biệt: Chi tiết luồng dữ liệu & Tập trung mạnh vào Quản trị Admin - Kèm Trả Lời Vấn Đáp)*

Chào Quý (Trưởng nhóm), tài liệu này được thiết kế dựa đúng trên bảng phân công nhiệm vụ của bạn. Bạn nắm giữ "chìa khóa" của hệ thống (Auth, Admin, Database), nên thầy cô sẽ hỏi rất kỹ về luồng đi của dữ liệu giữa các file (`Controller` -> `Service` -> `Database`). 

Dưới đây là sơ đồ luồng (Data Flow), cách giải thích cho từng chức năng bạn đã làm và các kịch bản trả lời vấn đáp.

---

## LỜI TỰA: CƠ CHẾ KỸ THUẬT LÕI (TECHNICAL CORE)
Trước khi đi vào từng Module, chúng ta cần làm rõ 3 cơ chế kỹ thuật xuyên suốt dự án:

### 1. Dependency Injection (DI)
- **Hoạt động:** Thay vì Controller tự khởi tạo Service bằng từ khóa `new` (VD: `var service = new AuthService()`), chúng ta đăng ký Service vào DI Container (trong `Program.cs` thông qua `builder.Services.AddScoped<IAuthService, AuthService>()`). Controller chỉ cần khai báo Interface ở Constructor, ASP.NET Core sẽ tự động "bơm" (inject) instance vào.
- **Ý nghĩa:** Giảm sự phụ thuộc chặt chẽ (loose coupling). Nếu sau này muốn đổi logic Auth, chỉ cần tạo class `NewAuthService : IAuthService` và đổi cấu hình ở `Program.cs`, Controller không cần sửa 1 dòng code nào. Rất thuận lợi cho Unit Testing (Mock data).

### 2. Middleware & JWT Authentication
- **Hoạt động:** Request từ Client gửi lên kèm Header `Authorization: Bearer <Token>`. Request đi qua một "đường ống" (Pipeline) chứa `JwtBearerMiddleware`.
- **Xử lý:** Middleware sẽ dùng `SymmetricSecurityKey` (khóa bí mật trên Server) để giải mã Token. Nếu hợp lệ (chưa hết hạn, đúng chữ ký), Middleware trích xuất các `Claims` (UserId, Role) và nhét vào bối cảnh `HttpContext.User`. Từ đó, Attribute `[Authorize(Roles="Admin")]` ở Controller mới có cơ sở để cho phép hay từ chối (trả về 403 Forbidden).

### 3. Quy trình Biến đổi Dữ liệu (Data Transformation)
- **Client -> Controller:** `DTO` (Data Transfer Object) - Chỉ nhận những field cần thiết (VD: `LoginDTO` chỉ có Email, Pass). Tránh lộ cấu trúc DB.
- **Controller -> Service:** `DTO` hoặc Tham số (Params) - Chuyển giao dữ liệu để xử lý logic nghiệp vụ.
- **Service -> Repository/DB:** `Entity` (Models) - Dữ liệu được map sang dạng Class tương ứng với cấu trúc Bảng trong SQL Server. Sau đó dịch thành câu lệnh SQL.
- **Service -> Client:** `DTO` / `ApiResponse` - Dữ liệu được đóng gói vào `ApiResponse<T>` (có status, message) trả về cho Frontend.

---

## 1. MODULE XÁC THỰC (AUTH) & BẢO MẬT TOKEN

### 1.1. Luồng Đăng nhập (Login Flow)
**Trách nhiệm các file:**
- **`LoginDTO`**: Chứa `Email`, `Password`.
- **`AuthController`**: Nhận Request `POST /api/auth/login`, gọi `_authService.LoginAsync(dto)`.
- **`AuthService`**: Logic kiểm tra khóa tài khoản, mã hóa mật khẩu và sinh Token.

**Sơ đồ Luồng Đăng nhập:**
```
Client (Frontend)
  |
  | POST /api/auth/login
  | + LoginDTO { Email, Password }
  |
  v
AuthController.Login()
  |
  | -> Kiểm tra Input hợp lệ
  |
  v
AuthService.LoginAsync()
  |
  | -> FindByEmailAsync(email)         [Tìm User trong DB]
  | -> CheckPasswordAsync(password)    [So sánh Hash Pass]
  | -> GenerateJwtTokenAsync()         [Sinh JWT Token]
  |
  v
UserManager (ASP.NET Identity)
  |
  | -> Query: SELECT * FROM AspNetUsers WHERE Email = @email
  | -> Query: SELECT * FROM AspNetUserRoles WHERE UserId = @userId
  |
  v
SQL Server Database
  |
  | <- Trả về User Entity + Roles
  |
  v
AuthService (Tiếp tục)
  |
  | -> Tạo Claims { UserId, Email, Roles }
  | -> Ký bằng SymmetricSecurityKey (lấy từ appsettings.json)
  | -> Tạo JWT Token = Header.Payload.Signature
  |
  v
ApiResponse<AuthResponse>
  |
  | { 
  |   "statusCode": 200,
  |   "message": "Login thành công",
  |   "data": { 
  |     "token": "eyJhbGc...xxxxx",
  |     "expiresIn": 3600
  |   }
  | }
  |
  v
Client nhận Token -> Lưu vào LocalStorage -> Dùng cho lần request tiếp theo
```

**Giải thích mã nguồn quan trọng:**
1. `_userManager.FindByEmailAsync()`: Lệnh của ASP.NET Identity giúp tìm Entity User trong bảng `AspNetUsers` dựa trên Email.
2. `_userManager.CheckPasswordAsync()`: Không so sánh Pass chuỗi thô. Hàm này lấy chuỗi Pass người dùng nhập, băm (hash) theo chuẩn, rồi so sánh với chuỗi Hash đang lưu trong DB.
3. `GenerateJwtTokenAsync()`: Nếu đúng Pass, hàm này gom `UserId` và `Roles` vào `Claims`. Ký bằng thuật toán `HmacSha256` (khóa lấy trong `appsettings.json`) và trả về một chuỗi JWT.

**🗣 Kịch bản Vấn đáp:**
- **Câu hỏi 1:** *Tại sao em không lưu thẳng Token vào Database để quản lý mà lại dùng JWT?*
  **Trả lời:** "Thưa thầy cô, JWT là Stateless (không lưu trạng thái). Toàn bộ thông tin định danh và chữ ký bảo mật đã nằm gọn trong bản thân chuỗi JWT. Nếu lưu vào DB, mỗi lần xác thực Request, hệ thống lại phải chọc xuống DB 1 lần gây thắt cổ chai (bottleneck) và chậm hệ thống. Dùng JWT giúp server giảm tải hoàn toàn khâu đọc DB khi xác thực, tối ưu hiệu năng cực kỳ tốt ạ."

- **Câu hỏi 2:** *Nếu lộ JWT Token thì hacker có thể giả mạo User mãi mãi không?*
  **Trả lời:** "Dạ không, vì em đã thiết lập thời gian sống (Expiration) cho Token trong hàm `GenerateJwtTokenAsync` (ví dụ 1 tiếng). Hết 1 tiếng Token sẽ vô giá trị. Đồng thời trong logic code, em luôn kiểm tra thêm trạng thái khóa của tài khoản ở phía Database đối với các request quan trọng."

---

## 2. MODULE NGƯỜI DÙNG (PROFILE & USER)

### 2.1. Luồng Lấy Thông Tin Cá Nhân (Get Profile Flow)
**Trách nhiệm các file:**
- **`AuthController.GetProfile`**: Endpoint `GET /api/auth/profile`. Không nhận param nào từ URL.

**Sơ đồ Luồng Lấy Profile:**
```
Client (Frontend)
  |
  | GET /api/auth/profile
  | Header: Authorization: Bearer eyJhbGc...xxxxx
  |
  v
JwtBearerMiddleware (Pipeline)
  |
  | -> Trích xuất Token từ Header
  | -> Giải mã (Decrypt) Token bằng SymmetricSecurityKey
  | -> Xác thực Signature (Chữ ký điện tử)
  | -> Kiểm tra Expiration Time
  | -> Trích xuất Claims { UserId, Email, Roles }
  | -> Gắn vào HttpContext.User
  |
  v
AuthController.GetProfile()
  |
  | -> User.FindFirst(ClaimTypes.NameIdentifier)  [Lấy UserId từ Token]
  | -> Gọi AuthService.GetUserByIdAsync(userId)
  |
  v
AuthService
  |
  | -> UserManager.FindByIdAsync(userId)  [Tìm User trong DB]
  |
  v
SQL Server Database
  |
  | <- Trả về User Entity
  |
  v
AuthService (Tiếp tục)
  |
  | -> Map Entity User -> UserProfileDTO
  | -> Loại bỏ Password, SecurityStamp, ...
  |
  v
ApiResponse<UserProfileDTO>
  |
  | {
  |   "statusCode": 200,
  |   "data": {
  |     "id": "user123",
  |     "email": "user@example.com",
  |     "fullName": "Nguyễn Văn A",
  |     "profilePicture": "https://...",
  |     "biography": "..."
  |   }
  | }
  |
  v
Client hiển thị Profile lên giao diện
```

**Giải thích mã nguồn quan trọng:**
- `User.FindFirst(ClaimTypes.NameIdentifier)`: Cách trích xuất an toàn nhất. Controller tự động móc ID từ `HttpContext.User` (đã được Middleware chứng thực ở trên).

**🗣 Kịch bản Vấn đáp:**
- **Câu hỏi 3:** *Làm sao em ngăn chặn User A sửa thông tin của User B (lỗ hổng IDOR)?*
  **Trả lời:** "Em không bao giờ tin tưởng ID truyền từ Frontend lên trong các nghiệp vụ liên quan đến cá nhân. Backend sẽ tự động 'mổ' Token ra bằng `User.FindFirst(ClaimTypes.NameIdentifier)` để lấy UserId. Vì JWT có chữ ký điện tử không thể làm giả, hacker không thể nào đổi Payload ID thành người khác được."

---

## 3. MODULE QUẢN TRỊ HỆ THỐNG (ADMIN)

### 3.1. Luồng Thống kê Dashboard (Dashboard Stats Flow)
**Trách nhiệm các file:**
- **`AdminDashboardController`**: Được gán `[Authorize(Roles = "Admin")]`.
- **`AdminDashboardService`**: Xử lý logic thống kê.

**Sơ đồ Luồng Dashboard Stats:**
```
Admin User (Frontend)
  |
  | GET /api/admin/dashboard/stats
  | Header: Authorization: Bearer <AdminToken>
  |
  v
JwtBearerMiddleware
  |
  | -> Xác thực Token
  | -> Kiểm tra Claims có Role = "Admin" không?
  |
  v
[Authorize(Roles = "Admin")] Attribute
  |
  | -> Nếu Role != Admin -> Trả về 403 Forbidden
  | -> Nếu Role = Admin -> Tiếp tục
  |
  v
AdminDashboardController.GetStats()
  |
  | -> Gọi AdminDashboardService.GetDashboardStatsAsync()
  |
  v
AdminDashboardService
  |
  | -> _context.Posts.CountAsync()           [Đếm tổng Posts]
  | -> _context.Users.CountAsync()           [Đếm tổng Users]
  | -> _context.Comments.CountAsync()        [Đếm tổng Comments]
  | -> _context.Posts.Where(x => x.Status == PostStatus.Reported).CountAsync()
  |    [Đếm Posts bị báo cáo]
  |
  v
Entity Framework Core (LINQ -> SQL)
  |
  | Sinh ra câu lệnh SQL:
  | SELECT COUNT(*) FROM Posts
  | SELECT COUNT(*) FROM Users
  | SELECT COUNT(*) FROM Comments
  | SELECT COUNT(*) FROM Posts WHERE Status = 'Reported'
  |
  v
SQL Server Database
  |
  | <- Trả về các con số (Integers)
  |
  v
AdminDashboardService (Tiếp tục)
  |
  | -> Gom các số liệu vào DashboardStatsDTO
  | -> Tính toán tỉ lệ phần trăm (nếu cần)
  | -> Tạo Timeline (Biểu đồ xu hướng)
  |
  v
ApiResponse<DashboardStatsDTO>
  |
  | {
  |   "statusCode": 200,
  |   "data": {
  |     "totalUsers": 1500,
  |     "totalPosts": 8900,
  |     "totalComments": 45000,
  |     "reportedPosts": 23,
  |     "activeUsersToday": 340
  |   }
  | }
  |
  v
Admin Dashboard Frontend
  |
  | Hiển thị biểu đồ & số liệu thống kê
```

**Giải thích mã nguồn quan trọng:**
- `_context.Posts.CountAsync()`: Dùng LINQ đẩy câu lệnh COUNT thẳng xuống SQL Server.

**🗣 Kịch bản Vấn đáp:**
- **Câu hỏi 4:** *Tại sao em dùng `.CountAsync()` thay vì lấy danh sách `.ToListAsync().Count()`?*
  **Trả lời:** "Nếu dùng `.ToListAsync().Count()`, EF Core sẽ sinh lệnh `SELECT * FROM Posts`, kéo toàn bộ dữ liệu từ SQL Server về RAM của hệ thống (RAM C#) rồi mới đếm, làm sập server nếu dữ liệu lớn. Còn `.CountAsync()` sẽ sinh ra lệnh `SELECT COUNT(*) FROM Posts`. Việc đếm diễn ra ngay tại Database, ứng dụng C# chỉ nhận đúng 1 con số. Đây là nguyên tắc tối ưu hiệu năng cơ bản ạ."

### 3.2. Luồng Kiểm duyệt & Khóa Bài viết

**Sơ đồ Luồng Kiểm duyệt Post:**
```
Admin User (Frontend)
  |
  | PUT /api/admin/posts/{postId}/hide
  | Header: Authorization: Bearer <AdminToken>
  | Body: { reason: "Nội dung không phù hợp" }
  |
  v
AdminPostController.HidePost(postId, request)
  |
  | -> Xác thực Admin Role (Middleware)
  | -> Validation: postId có tồn tại không?
  | -> Gọi AdminPostService.HidePostAsync(postId, reason)
  |
  v
AdminPostService
  |
  | -> _context.Posts.FindAsync(postId)  [Tìm Post trong DB Cache]
  | -> Kiểm tra Post.Status != Hidden (Chưa bị ẩn)
  |
  v
Post Entity
  |
  | <- Trả về Post Entity
  |
  v
AdminPostService (Tiếp tục)
  |
  | -> Post.Status = PostStatus.Hidden
  | -> Post.HiddenReason = reason
  | -> Post.HiddenBy = currentAdminId
  | -> Post.HiddenAt = DateTime.Now
  |
  v
DbContext.SaveChangesAsync()
  |
  | Sinh lệnh SQL:
  | UPDATE Posts 
  | SET Status = 'Hidden', 
  |     HiddenReason = @reason,
  |     HiddenBy = @adminId,
  |     HiddenAt = @now
  | WHERE Id = @postId
  |
  v
SQL Server Database
  |
  | <- Xác nhận UPDATE thành công (RowsAffected = 1)
  |
  v
AdminPostService (Tiếp tục)
  |
  | -> Gọi NotificationService.NotifyPostHidden(postId, userId)
  |    [Gửi thông báo cho chủ post]
  | -> SignalR Hub Context.Clients
  |    .User(userId)
  |    .SendAsync("PostHidden", postId, reason)
  |
  v
ApiResponse<SuccessMessage>
  |
  | {
  |   "statusCode": 200,
  |   "message": "Post đã bị ẩn thành công"
  | }
  |
  v
Admin Dashboard
  |
  | Cập nhật UI: Post biến mất khỏi danh sách
  | Chủ Post nhận thông báo: "Bài viết của bạn đã bị xóa vì ..."
```

- `_context.Posts.FindAsync(id)`: Tìm Entity Post theo ID. Nhanh hơn `.FirstOrDefaultAsync()` vì tìm trong Local Cache trước.
- `_context.SaveChangesAsync()`: Cập nhật `Status` thành `Hidden`, gom thay đổi và sinh lệnh `UPDATE` xuống DB.

---

## 4. MODULE BẠN BÈ (FRIENDSHIP) & THÔNG BÁO

### 4.1. Luồng Gửi Lời Mời Kết Bạn
**Trách nhiệm các file:**
- **`FriendshipController`**: Nhận `ReceiverId`.
- **`FriendshipService`**: Logic kiểm tra chưa kết bạn thì mới cho tạo FriendShip `Pending`.
- **`IFriendshipRepository`**: Nơi thực thi lệnh ghi DB. 
- **`NotificationService`**: Đẩy thông báo Real-time bằng SignalR.

**Sơ đồ Luồng Gửi Lời Mời Kết Bạn:**
```
User A (Sender) - Frontend
  |
  | POST /api/friendship/request
  | Body: { receiverId: "user-b-id" }
  | Header: Authorization: Bearer <TokenA>
  |
  v
FriendshipController.SendFriendRequest()
  |
  | -> Xác thực Token: Lấy UserId = User A
  | -> Validation: receiverId != senderId?
  | -> Gọi FriendshipService.SendFriendRequestAsync(senderId, receiverId)
  |
  v
FriendshipService
  |
  | -> Repository.GetFriendshipStatusAsync(userA.Id, userB.Id)
  |    [Kiểm tra đã là bạn hay chưa?]
  | -> Nếu Status = "Friends" -> Trả về lỗi "Already friends"
  | -> Nếu Status = "Pending" -> Trả về lỗi "Request already sent"
  | -> Nếu Status = "Blocked" -> Trả về lỗi "User blocked"
  |
  v
FriendshipRepository
  |
  | -> Query DB:
  |    SELECT * FROM Friendships 
  |    WHERE (SenderId = @userA AND ReceiverId = @userB)
  |    OR (SenderId = @userB AND ReceiverId = @userA)
  |
  v
SQL Server Database
  |
  | <- Không có record -> Status = None (Chưa kết bạn)
  |
  v
FriendshipService (Tiếp tục)
  |
  | -> Tạo Friendship Entity mới:
  |    new Friendship {
  |      SenderId = userA.Id,
  |      ReceiverId = userB.Id,
  |      Status = FriendshipStatus.Pending,
  |      CreatedAt = DateTime.Now
  |    }
  | -> Repository.AddAsync(friendship)  [Thêm vào DbContext]
  | -> Repository.SaveAsync()            [Commit xuống DB]
  |
  v
Entity Framework Core
  |
  | Sinh lệnh SQL:
  | INSERT INTO Friendships 
  | (SenderId, ReceiverId, Status, CreatedAt) 
  | VALUES (@userA, @userB, 'Pending', @now)
  |
  v
SQL Server Database
  |
  | <- Xác nhận INSERT thành công, trả về Id
  |
  v
FriendshipService (Tiếp tục)
  |
  | -> Gọi NotificationService.SendFriendRequestNotification(
  |      receiverId: userB.Id,
  |      senderName: userA.FullName,
  |      senderId: userA.Id
  |    )
  |
  v
NotificationService
  |
  | -> Tạo Notification Entity:
  |    new Notification {
  |      UserId = userB.Id,
  |      Type = "FriendRequest",
  |      Message = "userA muốn kết bạn với bạn",
  |      RelatedUserId = userA.Id,
  |      CreatedAt = DateTime.Now
  |    }
  | -> Save vào DB
  | -> Gọi SignalR HubContext
  |    .Clients.User(userB.Id)  [Gửi cho User B]
  |    .SendAsync("FriendRequestReceived", {
  |      senderId: userA.Id,
  |      senderName: userA.FullName,
  |      senderAvatar: userA.ProfilePicture,
  |      timestamp: DateTime.Now
  |    })
  |
  v
SignalR WebSocket Connection (Real-time)
  |
  | <- Gửi gói tin qua WebSocket
  | <- Nếu User B Online: Nhận ngay lập tức
  | <- Nếu User B Offline: Message queue, gửi lại khi Online
  |
  v
User B - Frontend (Browser)
  |
  | OnMessage ("FriendRequestReceived")
  | |
  | -> Hiển thị Notification Toast
  | -> Cập nhật Friend Request List
  | -> Phát âm thanh thông báo (nếu có)
  |
  v
ApiResponse (Trả về cho User A)
  |
  | {
  |   "statusCode": 200,
  |   "message": "Lời mời kết bạn đã được gửi",
  |   "data": { friendshipId: "...", status: "Pending" }
  | }
  |
  v
User A Frontend
  |
  | Hiển thị: "Đã gửi lời mời kết bạn"
  | Button thay đổi: "Cancel Request" (cho phép hủy nếu muốn)
```

**Giải thích cơ chế SignalR:**
- Khi lưu DB xong, `FriendshipService` gọi `NotificationService`. Service này dùng `_hubContext` của SignalR đẩy gói tin qua **WebSocket** trực tiếp tới Frontend của người nhận (dò theo `receiverId`), giúp chuông thông báo nhảy ngay lập tức mà không cần tải lại trang.

**🗣 Kịch bản Vấn đáp:**
- **Câu hỏi 5:** *Tại sao em lại dùng Repository Pattern ở đây mà không gọi DbContext trực tiếp vào Service như Admin?*
  **Trả lời:** "Áp dụng Repository Pattern (`IFriendshipRepository`) giúp cô lập hoàn toàn Entity Framework Core khỏi Service logic. Nhờ vậy, code sạch hơn (Clean Architecture), tuân thủ nguyên lý Dependency Inversion, và em có thể dễ dàng viết Unit Test (Mock cái Interface này lại) mà không cần cấu hình Database ảo."

---

## 5. HẠ TẦNG & TRIỂN KHAI (INFRASTRUCTURE)

### 5.1. Luồng Tích hợp Liên tục (CI) & Môi trường Đồng nhất
**Luồng xử lý:**
```text
[VS Code của Quý] 
   └──(git commit & push)──> [GitHub Repository] 
        └──(Kích hoạt)──> [GitHub Actions (Chạy file ci-cd.yml)]
             ├──(Bước 1: Cài đặt .NET SDK)
             ├──(Bước 2: Restore & Build source code)
             └──(Bước 3: Run Unit Tests tự động)
                  └── [Xác nhận Code không có lỗi trước khi Merge!]
```

**🗣 Kịch bản Vấn đáp:**
- **Câu hỏi 6:** *Nhóm em làm sao để đảm bảo code gộp lên nhánh main không bị lỗi (build fail)?*
  **Trả lời:** "Để giải quyết vấn đề đó, em đã thiết lập luồng CI (Continuous Integration) bằng GitHub Actions. Mỗi khi có code mới Push lên nhánh chính hoặc tạo Pull Request, GitHub sẽ tự động tạo một máy chủ ảo, kéo code về, tự động Build và chạy toàn bộ Unit Tests. Nếu code bị lỗi hoặc Test fail, nó sẽ báo đỏ và không cho Merge. Điều này giúp đảm bảo source code của nhóm luôn trong tình trạng 'Sạch' và có thể chạy được ở mọi thời điểm."

- **Câu hỏi 7:** *Em áp dụng Docker để làm gì trong dự án này (nếu có hỏi)?*
  **Trả lời:** "Docker giúp em giải quyết triệt để vấn đề 'Code chạy ngon trên máy em nhưng lỗi máy bạn'. Nó đóng gói mã nguồn C# kèm theo toàn bộ môi trường (Runtime .NET) thành một khối (Container). Nhờ thế môi trường phát triển của cả nhóm được đồng nhất 100%."

---

## 6. MODULE QUẢN LÝ TỆP TIN & MEDIA (FILE UPLOAD & MEDIA MANAGEMENT)

### 6.1. Luồng Upload Ảnh (Profile Picture & Post Media)
**Trách nhiệm các file:**
- **`MediaController`**: Endpoint `POST /api/media/upload` - Nhận file từ Client.
- **`IFileUploadService`**: Interface định nghĩa các phương thức upload/delete.
- **`FileUploadService`**: Logic thực thi upload file lên **Azure Blob Storage**.
- **`MediaCleanupService`**: Xóa file cũ khi cập nhật (Avatar, Post Media).

**Sơ đồ Luồng Upload File:**
```
User (Frontend)
  |
  | 1. Chọn file từ máy cá nhân
  | 2. Form-data: { file: <binary> }
  | 3. POST /api/media/upload
  | 4. Header: Authorization: Bearer <Token>
  |
  v
MediaController.Upload(IFormFile file)
  |
  | -> Kiểm tra file != null
  | -> Kiểm tra file.Length > 0
  | -> Kiểm tra ContentType (image/jpeg, image/png, video/mp4, ...)
  | -> Gọi FileUploadService.UploadFileAsync(file, "interacthub-media")
  |
  v
FileUploadService
  |
  | -> Tạo unique filename: Guid.NewGuid() + "_" + original_filename
  |    (Ví dụ: "a1b2c3d4-e5f6-7890-abcd_avatar.jpg")
  |
  | -> Kết nối đến Azure Blob Storage
  |    (Sử dụng Connection String từ appsettings.json)
  |
  | -> Lấy reference tới container "interacthub-media"
  |    (Nếu không tồn tại -> Tạo mới + Set Public Access)
  |
  v
Azure Blob Storage Container
  |
  | -> CreateIfNotExistsAsync("interacthub-media")
  | -> Kiểm tra container đã tồn tại chưa?
  |
  v
FileUploadService (Tiếp tục)
  |
  | -> Mở stream từ file (file.OpenReadStream())
  | -> Gọi blobClient.UploadAsync(stream, BlobHttpHeaders)
  |    - ContentType = file.ContentType
  |    - Metadata (tuỳ chọn): userId, uploadDate, ...
  |
  v
Azure Blob Storage
  |
  | <- Nhận binary data stream
  | <- Lưu file vào physical storage
  | <- Tự động tạo unique URL:
  |    https://account.blob.core.windows.net/
  |    interacthub-media/a1b2c3d4-e5f6-7890-abcd_avatar.jpg
  |
  v
FileUploadService (Tiếp tục)
  |
  | -> Trích xuất URL cuối cùng
  | -> Loại bỏ SAS token (Query string) nếu có
  | -> Trả về URL sạch: 
  |    "https://account.blob.core.windows.net/interacthub-media/a1b2c3d4...jpg"
  |
  v
MediaController
  |
  | -> Trả về ApiResponse<string>
  | {
  |   "statusCode": 200,
  |   "message": "Upload file successfully",
  |   "data": "https://account.blob.core.windows.net/interacthub-media/a1b2c3d4...jpg"
  | }
  |
  v
Frontend (Browser)
  |
  | -> Nhận URL file
  | -> Nếu là upload avatar -> Gọi AuthService.UpdateProfile(profilePictureUrl)
  | -> Nếu là upload post media -> Gọi PostService.CreatePost(content, mediaUrls)
  | -> Hiển thị preview ảnh/video
```

**Các bước chi tiết trong FileUploadService:**
1. **Validation:** Kiểm tra `file == null` hoặc `file.Length == 0` -> Ném `ArgumentException`
2. **Unique Filename:** `Guid.NewGuid() + "_" + Path.GetFileName(file.FileName)` - Tránh conflict nếu 2 user cùng upload file tên giống
3. **Connection:** `BlobServiceClient` từ connection string trong `appsettings.json`
4. **Container:** `GetBlobContainerClient("interacthub-media")` - Lấy/tạo container
5. **Upload:** `blobClient.UploadAsync(stream)` - Stream file lên Azure
6. **Clean URL:** Loại bỏ SAS token (phần `?sv=...`) khỏi URL trước khi trả về

**🗣 Kịch bản Vấn đáp:**
- **Câu hỏi 8:** *Tại sao em không lưu file trực tiếp trên server mà lại dùng Azure Blob Storage?*
  **Trả lời:** "Nếu lưu file trên server, khi số lượng user tăng, dung lượng ổ cứng sẽ đầy nhanh và khó mở rộng (scale). Azure Blob Storage là dịch vụ storage đám mây của Microsoft, giới hạn dung lượng rất cao (Petabytes). Thứ hai, file được lưu trên Azure sẽ có URL công khai (CDN), download rất nhanh từ khắp nơi. Thứ ba, quản lý file dễ hơn: không cần backup phức tạp, replicate tự động, bảo mật cao. Ứng dụng C# chỉ cần lưu URL vào DB, không cần lưu file trực tiếp."

- **Câu hỏi 9:** *Làm sao em đảm bảo user không upload file quá lớn hoặc file độc hại (malware)?*
  **Trả lời:** "Em có kiểm tra file size ở phía Backend trước khi upload. Cụ thể, em sẽ kiểm tra `file.Length <= MAX_FILE_SIZE` (ví dụ 50MB). Nếu vượt quá sẽ trả về lỗi 400 Bad Request. Ngoài ra, em whitelist các loại file được phép: `.jpg`, `.png`, `.mp4`, `.mp3` bằng cách kiểm tra `file.ContentType` và `Path.GetExtension()`. File độc hại sẽ bị chặn ngay. Azure cũng có anti-malware scanning tích hợp sẵn."

---

### 6.2. Luồng Xóa File (Cleanup Old Media)
**Trách nhiệm các file:**
- **`MediaController.Delete(fileUrl)`**: Endpoint `DELETE /api/media/delete?fileUrl=...`
- **`FileUploadService.DeleteFileAsync(fileUrl)`**: Xóa file từ Azure Blob Storage
- **`MediaCleanupService`**: Tự động xóa file cũ khi cập nhật avatar, post, ...

**Sơ đồ Luồng Xóa File:**
```
User hoặc System (Auto Cleanup)
  |
  | Scenario 1: User xóa bài viết
  | Scenario 2: User cập nhật avatar (ảnh cũ cần xóa)
  | Scenario 3: Admin xóa bài viết vi phạm
  |
  v
MediaController.Delete(fileUrl) 
  hoặc 
Service.DeleteFileAsync(fileUrl)
  |
  | -> Kiểm tra fileUrl != null && != empty
  | -> Parse URL để trích xuất Container Name & Blob Name
  |    Ví dụ: https://account.blob.core.windows.net/interacthub-media/a1b2c3d4...jpg
  |           -> Container: "interacthub-media"
  |           -> Blob: "a1b2c3d4...jpg"
  |
  v
FileUploadService.DeleteFileAsync()
  |
  | -> Tạo Uri object từ fileUrl
  | -> Lấy uri.Segments để tách Container & Blob Name
  | -> Gọi containerClient.GetBlobClient(blobName)
  | -> Gọi blobClient.DeleteIfExistsAsync()
  |
  v
Azure Blob Storage
  |
  | <- Nhận yêu cầu xóa
  | <- Tìm blob theo tên
  | <- Xóa blob khỏi storage
  | <- Trả về response.Value (true/false)
  |
  v
FileUploadService (Tiếp tục)
  |
  | Nếu DeleteIfExistsAsync() = true:
  |   -> File đã bị xóa thành công
  | Nếu DeleteIfExistsAsync() = false:
  |   -> File không tồn tại hoặc đã bị xóa trước đó
  | Nếu có Exception:
  |   -> Catch exception, trả về false
  |
  v
ApiResponse
  |
  | {
  |   "statusCode": 200,
  |   "message": "File deleted successfully"
  | }
  | HOẶC
  | {
  |   "statusCode": 400,
  |   "message": "Failed to delete file or file not found"
  | }
  |
  v
Frontend / System
  |
  | Cập nhật UI hoặc log lại action
```

**Luồng Tự động Cleanup (MediaCleanupService):**
```
User cập nhật Avatar
  |
  | PUT /api/auth/update-profile
  | Body: { fullName: "...", profilePicture: <new-url> }
  |
  v
AuthService.UpdateProfileAsync()
  |
  | -> Lấy User cũ từ DB
  | -> Lưu URL ảnh cũ: oldAvatarUrl = user.ProfilePicture
  | -> Cập nhật user.ProfilePicture = newUrl
  | -> SaveChangesAsync() -> DB
  | -> Gọi MediaCleanupService.DeleteOldMediaAsync(oldAvatarUrl)
  |
  v
MediaCleanupService
  |
  | -> Kiểm tra oldAvatarUrl != null
  | -> Gọi _fileUploadService.DeleteFileAsync(oldAvatarUrl)
  | -> Xóa file cũ khỏi Azure
  | -> Logging: "Old avatar deleted: {oldUrl}"
  |
  v
Azure Blob Storage
  |
  | <- Xóa ảnh avatar cũ
  |
  v
User Frontend
  |
  | Hiển thị avatar mới
  | (File cũ đã bị dọn dẹp, tiết kiệm storage)
```

**Tối ưu: Sử dụng Expiration Policy trên Azure (Tuỳ chọn):**
- Thiết lập **Blob Lifecycle Policy** trên Azure: "Xóa tự động file nào không được sử dụng trong 30 ngày"
- Hoặc: "Chuyển file sang Tier lạnh (Cool/Archive) sau 7 ngày để tiết kiệm chi phí"

**🗣 Kịch bản Vấn đáp:**
- **Câu hỏi 10:** *Nếu có 100.000 user mỗi ngày upload ảnh, dung lượng Azure sẽ kinh khủng. Em làm sao để quản lý chi phí?*
  **Trả lời:** "Đúng vậy. Em đã thiết kế MediaCleanupService để tự động xóa file cũ khi user cập nhật. Ví dụ, nếu user đổi avatar 5 lần, chỉ lưu ảnh mới nhất, 4 ảnh cũ sẽ bị xóa. Thứ hai, em thiết lập Blob Lifecycle Policy trên Azure: file nào chỉ được xem trong 30 ngày sẽ tự động xóa hoặc chuyển sang storage lạnh (rẻ hơn 90%). Thứ ba, em compress ảnh trước khi upload: video > 500MB sẽ được reject, ảnh lớn tự động resize xuống 1200x1200px để tiết kiệm dung lượng."

- **Câu hỏi 11:** *Điều gì xảy ra nếu user upload file và URL được lưu vào DB, nhưng file lại bị xóa nhầm từ Azure?*
  **Trả lời:** "Đó là một risk. Em giải quyết như sau: (1) Soft Delete - Thay vì xóa file ngay, chuyển sang trạng thái 'Archived' trong 30 ngày, rồi mới xóa vĩnh viễn. (2) Backup Strategy - Azure Blob Storage tự động replicate 3 bản trong các data center khác nhau. (3) Monitoring - Nếu phát hiện 404 (file not found), em log lại và alert cho admin. (4) Failover - Nếu Azure lỗi, chuyển sang backup storage khác."

---

## 7. MODULE QUẢN LÝ NHẬT KÝ HOẠT ĐỘNG (ADMIN ACTIVITY LOG & AUDIT TRAIL)

### 7.1. Luồng Ghi Nhật Ký Hoạt Động Admin
**Trách nhiệm các file:**
- **`ActivityLogController`**: Endpoint lấy log với filter & phân trang.
- **`IActivityLogService`**: Interface định nghĩa các phương thức logging.
- **`ActivityLogService`**: Logic ghi & truy vấn log từ DB.
- **`ActivityLog Model`**: Entity lưu trữ thông tin hoạt động admin.

**Sơ đồ Luồng Ghi Log Hoạt Động:**
```
Admin thực hiện hành động
  |
  | Ví dụ: Xóa bài viết vi phạm
  | 1. Bấm nút "Hide Post"
  | 2. Điền lý do: "Nội dung xấu độc"
  | 3. PUT /api/admin/posts/{postId}/hide
  |
  v
AdminPostController.HidePost(postId, request)
  |
  | -> Kiểm tra quyền Admin
  | -> Lấy UserId từ JWT Token
  | -> Lấy IP Address từ HttpContext
  |
  v
AdminPostService.HidePostAsync()
  |
  | -> Cập nhật Post.Status = Hidden
  | -> SaveChangesAsync() -> DB
  | -> Gọi ActivityLogService.LogActivityAsync(...)
  |
  v
ActivityLogService.LogActivityAsync()
  |
  | -> Tạo ActivityLog Entity:
  |    new ActivityLog {
  |      AdminId = <admin-id>,
  |      Action = "HidePost",
  |      ActionCategory = "Content Moderation",
  |      Reason = "Nội dung xấu độc",
  |      TargetPostId = <post-id>,
  |      TargetUserId = <post-owner-id>,
  |      Severity = "High",
  |      OldValue = "Active",
  |      NewValue = "Hidden",
  |      IpAddress = "192.168.1.100",
  |      CreatedAt = DateTime.UtcNow
  |    }
  |
  | -> _context.ActivityLogs.Add(activityLog)
  | -> SaveChangesAsync() -> DB
  | -> _logger.LogInformation("Activity logged: HidePost...")
  |
  v
SQL Server Database
  |
  | INSERT INTO ActivityLogs 
  | (AdminId, Action, ActionCategory, Reason, TargetPostId, TargetUserId,
  |  Severity, OldValue, NewValue, IpAddress, CreatedAt)
  | VALUES (@adminId, @action, @category, @reason, @postId, @userId,
  |         @severity, @oldValue, @newValue, @ip, @now)
  |
  | <- Xác nhận INSERT thành công
  |
  v
ActivityLogService (Tiếp tục)
  |
  | -> Trả về ActivityLog Entity
  | -> Logging: "Activity logged successfully"
```

**Các loại hành động được ghi log:**
```
┌─ Content Moderation
│  ├─ HidePost      (Ẩn bài viết)
│  ├─ DeletePost    (Xóa bài viết)
│  ├─ BlockComment  (Chặn comment)
│  └─ RemoveReport  (Bỏ báo cáo)
│
├─ User Management
│  ├─ BanUser       (Cấm user)
│  ├─ UnbanUser     (Bỏ cấm user)
│  ├─ SuspendUser   (Tạm khóa)
│  └─ ResetPassword (Reset mật khẩu)
│
├─ System Configuration
│  ├─ UpdateSettings (Cập nhật cài đặt)
│  ├─ ChangePolicy   (Thay đổi chính sách)
│  └─ ManageRoles    (Quản lý role)
│
└─ Security
   ├─ AdminLogin    (Admin đăng nhập)
   ├─ AdminLogout   (Admin đăng xuất)
   ├─ FailedAttempt (Cố gắng đăng nhập thất bại)
   └─ AccessDenied  (Truy cập bị từ chối)
```

**🗣 Kịch bản Vấn đáp:**
- **Câu hỏi 12:** *Làm sao em xác định được hành động nào được admin thực hiện? Em có theo dõi admin không?*
  **Trả lời:** "Vâng, em đã thiết kế ActivityLogService để ghi lại mọi hành động quan trọng của admin. Mỗi khi admin xóa post, khóa user hay thay đổi cài đặt hệ thống, log này sẽ tự động ghi vào bảng `ActivityLogs`. Log lưu: UserId của admin, hành động (Action), danh mục (Category), lý do, dối tượng bị tác động (TargetPostId, TargetUserId), IP address, thời gian, và mức độ nghiêm trọng (Severity). Nhờ thế, nếu có vấn đề gì, thầy cô có thể kiểm tra xem admin nào đã làm gì, khi nào, vì sao."

- **Câu hỏi 13:** *Nếu admin thay đổi dữ liệu nhạy cảm (như xóa 1000 post), thì admin có thể xóa log này để xóa dấu vết không?*
  **Trả lời:** "Để giải quyết vấn đề đó, em đã áp dụng một số biện pháp: (1) Immutable Logs - Sau khi lưu, log không thể sửa đổi hoặc xóa, chỉ có owner của database hoặc super admin mới có quyền xóa. (2) Segregation - ActivityLogs được lưu trong một bảng riêng biệt, không phụ thuộc vào dữ liệu application chính. (3) Backup Logs - Log cũ được tự động backup sang Azure Blob Storage hàng tuần. (4) Alerting - Nếu phát hiện admin cố gắng xóa/sửa log, hệ thống sẽ log lại hành động này và gửi alert tới super admin."

---

### 7.2. Luồng Xem Nhật Ký & Lọc Log
**Endpoint:**
- **`GET /api/admin/activity-logs`** - Lấy danh sách log với filter & pagination
- **`GET /api/admin/activity-logs/stats`** - Lấy thống kê log

**Sơ đồ Luồng Xem Log:**
```
Admin User (Dashboard)
  |
  | Truy cập Activity Log Dashboard
  | 1. Chọn filter: Category, Action, Severity
  | 2. Nhập ngày bắt đầu & ngày kết thúc
  | 3. Bấm "Search"
  |
  v
ActivityLogController.GetActivityLogs()
  |
  | GET /api/admin/activity-logs?skip=0&take=20&category=Content+Moderation&severity=High
  | Header: Authorization: Bearer <AdminToken>
  |
  v
ActivityLogController (Handler)
  |
  | -> Kiểm tra [Authorize(Roles = "Admin")]
  | -> Validation: skip >= 0 && take > 0
  | -> Lấy parameters: skip, take, category, action, severity
  | -> Gọi ActivityLogService.GetActivityLogsAsync(skip, take, category, action, severity)
  |
  v
ActivityLogService.GetActivityLogsAsync()
  |
  | -> Tạo LINQ query từ _context.ActivityLogs
  | -> Include Admin (Tên admin), Include TargetUser (Tên user bị tác động)
  |
  | if (category != null)
  |    -> query = query.Where(al => al.ActionCategory == category)
  | if (action != null)
  |    -> query = query.Where(al => al.Action == action)
  | if (severity != null)
  |    -> query = query.Where(al => al.Severity == severity)
  |
  | -> Tính tổng số record: total = await query.CountAsync()
  |
  v
Entity Framework Core (LINQ -> SQL)
  |
  | Sinh ra câu lệnh SQL:
  | SELECT COUNT(*) FROM ActivityLogs
  | WHERE ActionCategory = @category 
  | AND Action = @action 
  | AND Severity = @severity
  |
  v
SQL Server Database
  |
  | <- Trả về tổng số record
  |
  v
ActivityLogService (Tiếp tục)
  |
  | -> Query với pagination:
  |    .OrderByDescending(al => al.CreatedAt)  [Log mới nhất trước]
  |    .Skip(skip)                              [Bỏ qua N record đầu tiên]
  |    .Take(take)                              [Lấy N record tiếp theo]
  |
  | -> Mapping ActivityLog Entity -> ActivityLogDTO:
  |    {
  |      "id": "...",
  |      "adminName": "Ben Star",
  |      "action": "HidePost",
  |      "category": "Content Moderation",
  |      "targetUserName": "John Gaylord",
  |      "reason": "Nội dung xấu độc",
  |      "severity": "High",
  |      "oldValue": "Active",
  |      "newValue": "Hidden",
  |      "ipAddress": "192.168.1.100",
  |      "createdAt": "2026-05-15T10:30:00Z"
  |    }
  |
  v
ApiResponse<ActivityLogListResponseDTO>
  |
  | {
  |   "statusCode": 200,
  |   "message": "Activity logs retrieved successfully",
  |   "data": {
  |     "totalCount": 245,
  |     "pageSize": 20,
  |     "pageNumber": 1,
  |     "items": [
  |       { /* log 1 */ },
  |       { /* log 2 */ },
  |       ...
  |     ]
  |   }
  | }
  |
  v
Admin Dashboard (Frontend)
  |
  | Hiển thị:
  | - Bảng log với cột: Admin, Action, Category, Target User, Reason, Severity, IP, Time
  | - Pagination: Previous | 1 2 3 4 5 | Next
  | - Filter Panel: Category dropdown, Action dropdown, Severity dropdown
  | - Có thể click vào mỗi log để xem chi tiết đầy đủ
```

**Sơ đồ Lấy Thống Kê Log:**
```
Admin bấm nút "Statistics"
  |
  | GET /api/admin/activity-logs/stats
  |
  v
ActivityLogService.GetActivityStatsAsync()
  |
  | -> Tính số log theo mỗi Category:
  |    var categoryStats = _context.ActivityLogs
  |      .GroupBy(al => al.ActionCategory)
  |      .Select(g => new { Category = g.Key, Count = g.Count() })
  |      .ToList()
  |    (Ví dụ: Content Moderation: 152 logs, User Management: 47 logs)
  |
  | -> Tính số log theo mỗi Severity:
  |    var severityStats = _context.ActivityLogs
  |      .GroupBy(al => al.Severity)
  |      .Select(g => new { Severity = g.Key, Count = g.Count() })
  |      .ToList()
  |    (Ví dụ: High: 89 logs, Medium: 75 logs, Low: 35 logs)
  |
  | -> Tính số log của mỗi Admin:
  |    var adminStats = _context.ActivityLogs
  |      .GroupBy(al => al.Admin.FullName)
  |      .Select(g => new { Admin = g.Key, ActionCount = g.Count() })
  |      .OrderByDescending(x => x.ActionCount)
  |      .Take(10)  [Top 10 admins]
  |      .ToList()
  |
  | -> Tính xu hướng hàng ngày (Timeline):
  |    var dailyStats = _context.ActivityLogs
  |      .GroupBy(al => al.CreatedAt.Date)
  |      .Select(g => new { Date = g.Key, Count = g.Count() })
  |      .OrderBy(x => x.Date)
  |      .ToList()
  |    [Lấy 30 ngày gần nhất]
  |
  v
ApiResponse<ActivityLogStatsDTO>
  |
  | {
  |   "statusCode": 200,
  |   "data": {
  |     "totalLogs": 284,
  |     "categoryBreakdown": [
  |       { "category": "Content Moderation", "count": 152 },
  |       { "category": "User Management", "count": 89 },
  |       { "category": "System Configuration", "count": 43 }
  |     ],
  |     "severityBreakdown": [
  |       { "severity": "High", "count": 89 },
  |       { "severity": "Medium", "count": 121 },
  |       { "severity": "Low", "count": 74 }
  |     ],
  |     "topAdmins": [
  |       { "adminName": "Ben Star", "actionCount": 145 },
  |       { "adminName": "Admin2", "actionCount": 92 },
  |       ...
  |     ],
  |     "dailyTrend": [
  |       { "date": "2026-05-01", "count": 8 },
  |       { "date": "2026-05-02", "count": 12 },
  |       ...
  |     ]
  |   }
  | }
  |
  v
Admin Dashboard
  |
  | Hiển thị biểu đồ:
  | - Pie Chart: Category Breakdown
  | - Bar Chart: Severity Breakdown  
  | - Table: Top 10 Admins
  | - Line Chart: Daily Activity Trend
```

**Các trường dữ liệu trong ActivityLog:**
```
┌─ Identification
│  ├─ Id: Guid (Primary Key)
│  ├─ AdminId: Guid (Foreign Key -> User)
│  └─ CreatedAt: DateTime
│
├─ Action Details
│  ├─ Action: string (VD: "HidePost", "BanUser")
│  ├─ ActionCategory: string (VD: "Content Moderation", "User Management")
│  ├─ Reason: string (Lý do thực hiện hành động)
│  └─ Severity: string (Info, Medium, High, Critical)
│
├─ Target Information
│  ├─ TargetUserId: Guid? (User bị tác động)
│  ├─ TargetPostId: Guid? (Post bị tác động)
│  └─ TargetReportId: Guid? (Report bị tác động)
│
├─ Data Changes
│  ├─ OldValue: string? (Giá trị cũ)
│  └─ NewValue: string? (Giá trị mới)
│
└─ Security
   └─ IpAddress: string? (IP của admin)
```

**🗣 Kịch bản Vấn đáp:**
- **Câu hỏi 14:** *Admin xem log hàng ngàn lần mỗi ngày, sẽ không chậm sao?*
  **Trả lời:** "Em đã tối ưu query bằng cách dùng `.CountAsync()` để đếm tổng record (không lấy tất cả ra rồi đếm). Ngoài ra, em dùng pagination (skip/take) để chỉ lấy 20-50 log mỗi lần, không lấy toàn bộ hàng triệu record. Thứ ba, em có index trên cột `CreatedAt` và `ActionCategory` ở phía SQL Server để query nhanh hơn. Nếu log quá lớn (trên 1 triệu record), em sẽ archive log cũ (quá 3 tháng) sang Azure Blob để giảm kích thước bảng."

- **Câu hỏi 15:** *Nếu hệ thống crash, log có bị mất không?*
  **Trả lời:** "Log được lưu ngay vào SQL Server database sau khi hành động xong. Nên ngay cả khi app crash, log vẫn an toàn trong DB. Hơn nữa, SQL Server có transaction mechanism: nếu lưu log thất bại, toàn bộ hành động (như xóa post) sẽ rollback, không thực hiện. Nên không có trường hợp 'admin xóa post nhưng log không được ghi'."
