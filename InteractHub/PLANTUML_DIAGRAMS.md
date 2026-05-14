# PlantUML Diagrams for InteractHub

File này chứa toàn bộ code PlantUML cho các chức năng chính của dự án. Bạn có thể copy từng đoạn code này dán vào [PlantUML Online Server](http://www.plantuml.com/plantuml/uml/) để lấy hình ảnh.

---

## 0.1 Sơ đồ Use Case Tổng quan (Use Case Diagram)
```plantuml
@startuml
left to right direction
actor "User" as U
actor "Admin" as A

rectangle InteractHub {
  usecase "Đăng ký/Đăng nhập" as UC1
  usecase "Quản lý Hồ sơ" as UC2
  usecase "Đăng bài viết & Media" as UC3
  usecase "Tương tác (Like/Comment)" as UC4
  usecase "Kết bạn" as UC5
  usecase "Nhắn tin thời gian thực" as UC6
  usecase "Đăng/Xem Story" as UC7
  usecase "Tìm kiếm & Khám phá" as UC8
  
  usecase "Quản lý Người dùng" as UC9
  usecase "Kiểm duyệt nội dung (Report)" as UC10
  usecase "Xem Thống kê hệ thống" as UC11
}

U --> UC1
U --> UC2
U --> UC3
U --> UC4
U --> UC5
U --> UC6
U --> UC7
U --> UC8

A --> UC1
A --> UC9
A --> UC10
A --> UC11
@enduml
```

---

## 0.2 Sơ đồ Thực thể (ERD - Entity Relationship Diagram)
```plantuml
@startuml
entity "User" {
  * Id : Guid
  --
  UserName : string
  Email : string
  PasswordHash : string
  AvatarUrl : string
  Bio : string
}

entity "Post" {
  * Id : Guid
  --
  Content : string
  CreatedAt : DateTime
  UserId : Guid <<FK>>
}

entity "PostMedia" {
  * Id : Guid
  --
  Url : string
  PostId : Guid <<FK>>
}

entity "Comment" {
  * Id : Guid
  --
  Content : string
  CreatedAt : DateTime
  UserId : Guid <<FK>>
  PostId : Guid <<FK>>
}

entity "Like" {
  * UserId : Guid <<FK>>
  * PostId : Guid <<FK>>
}

entity "Friendship" {
  * UserAId : Guid <<FK>>
  * UserBId : Guid <<FK>>
  --
  Status : string (Pending/Accepted)
  CreatedAt : DateTime
}

entity "Story" {
  * Id : Guid
  --
  ImageUrl : string
  CreatedAt : DateTime
  ExpiresAt : DateTime
  UserId : Guid <<FK>>
}

User ||--o{ Post
Post ||--o{ PostMedia
Post ||--o{ Comment
Post ||--o{ Like
User ||--o{ Comment
User ||--o{ Like
User ||--o{ Friendship
User ||--o{ Story
@enduml
```

---

## 0.3 Sơ đồ Luồng dữ liệu (Data Flow Diagram - DFD)
```plantuml
@startuml
[User] as U
[Admin] as A
process "InteractHub System" as S
database "SQL Server" as DB
cloud "Azure Storage" as Cloud

U -> S : Gửi thông tin đăng ký/đăng nhập
S -> DB : Kiểm tra & Lưu User
DB -> S : Trả về kết quả

U -> S : Đăng bài (Text + Image)
S -> Cloud : Lưu Media
Cloud -> S : Trả về URL
S -> DB : Lưu Post & MediaURL

U -> S : Gửi yêu cầu kết bạn / Nhắn tin
S -> DB : Cập nhật quan hệ/Lưu Message
S -> U : Đẩy thông báo (SignalR)

A -> S : Xem báo cáo/Xóa bài
S -> DB : Query/Update Status
DB -> S : Success
S -> A : Hiển thị Dashboard
@enduml
```

---

## 1. Chức năng Đăng ký & Đăng nhập (Auth Flow)
```plantuml
@startuml
actor User
participant "Frontend (React)" as FE
participant "Backend (API)" as BE
database "SQL Server" as DB

User -> FE : Nhập Email/Password
FE -> BE : POST /api/auth/login 
BE -> DB : Kiểm tra User & Hash Password
DB --> BE : Kết quả xác thực
BE -> BE : Tạo JWT Token (Claims: Role, ID)
BE --> FE : Trả về Token & User Info
FE -> FE : Lưu Token vào LocalStorage
FE --> User : Điều hướng vào Dashboard
@enduml
```

---

Sequence_Post
## 2. Chức năng Đăng bài viết kèm Hình ảnh (Post Creation)
```plantuml
@startuml
actor User
participant "Frontend" as FE
participant "API / MediaController" as BE
participant "Azure Blob Storage" as Cloud
database "SQL Server" as DB

User -> FE : Chọn ảnh & Nhập nội dung
FE -> BE : POST /api/media/upload (File)
BE -> Cloud : Lưu trữ file hình ảnh
Cloud --> BE : Trả về URL ảnh
BE --> FE : Trả về Media URL
FE -> BE : POST /api/posts (Content + MediaURL)
BE -> DB : Lưu Post & PostMedia
DB --> BE : Success
BE --> FE : Trả về Post Object
FE -> FE : Cập nhật UI (Optimistic Update)
@enduml
```

---

Sequence_Like_Noti
## 3. Chức năng Tương tác (Like bài viết)
```plantuml
@startuml
actor User
participant "Frontend" as FE
participant "API / LikeController" as BE
participant "NotificationService" as NS
participant "SignalR Hub" as Hub
database "SQL Server" as DB

User -> FE : Nhấn nút Like
FE -> BE : POST /api/like/toggle
BE -> DB : Thêm/Xóa Like record
DB --> BE : Updated
BE -> NS : Tạo Notification object
NS -> DB : Lưu Notification
BE -> Hub : NotifyUser(OwnerId, Notification)
Hub -> FE : SignalR Callback (ReceiveNotification)
FE -> FE : Hiển thị Popup thông báo real-time
@enduml
```

---

Sequence_Friendship
## 4. Chức năng Kết bạn (Friend Request)
```plantuml
@startuml
actor "User A" as A
participant "Frontend" as FE
participant "API / Friendship" as BE
actor "User B" as B

A -> FE : Nhấn "Add Friend"
FE -> BE : POST /api/friendship/request
BE -> BE : Validate (Chưa là bạn bè)
BE -> BE : Tạo Friendship (Status: Pending)
BE --> FE : Success
BE -> B : Gửi Notification (SignalR)
B -> B : Xem lời mời & Nhấn "Accept"
B -> BE : POST /api/friendship/accept
BE -> BE : Cập nhật Status: Accepted
BE --> B : Bạn bè thành công
@enduml
```

---

Sequence_Story
## 5. Chức năng Tin tạm thời (Story Flow)
```plantuml
@startuml
actor User
participant "Frontend" as FE
participant "API / Story" as BE
database "SQL Server" as DB

User -> FE : Đăng Story (Ảnh/Video)
FE -> BE : POST /api/stories
BE -> DB : Lưu Story (ExpiresAt = Now + 24h)
DB --> BE : Success
... Sau 24 giờ ...
FE -> BE : GET /api/stories/active
BE -> DB : Query (WHERE ExpiresAt > Now)
DB --> BE : Danh sách Story còn hạn
BE --> FE : Hiển thị Story
@enduml
```

---

Sequence_Admin
## 6. Chức năng Quản trị & Thống kê (Admin Dashboard & Moderation)
```plantuml
@startuml
actor Admin
participant "Admin Dashboard" as FE
participant "API / AdminDashboard" as BE
database "SQL Server" as DB

Admin -> FE : Truy cập Dashboard
FE -> BE : GET /api/admin/dashboard/stats
BE -> DB : Tổng hợp (Users, Posts, Reports)
DB --> BE : Dữ liệu thống kê
BE --> FE : Hiển thị biểu đồ & Con số

Admin -> FE : Tìm kiếm bài viết vi phạm (Chủ động)
FE -> BE : GET /api/admin/posts/search?q="..."
BE -> DB : Tìm kiếm bài viết
DB --> BE : Kết quả
BE --> FE : Danh sách bài viết
Admin -> FE : Nhấn "Hide Post" (Ẩn bài viết)
FE -> BE : PUT /api/admin/posts/{id}/hide
BE -> DB : Cập nhật Status = 'Hidden'
DB --> BE : Success
BE --> FE : Bài viết đã ẩn thành công
@enduml
```

---

Sequence_Messaging
## 7. Chức năng Nhắn tin thời gian thực (Real-time Messaging)
```plantuml
@startuml
actor "User A" as A
participant "Frontend" as FEA
participant "API / Message" as BE
participant "SignalR ChatHub" as Hub
database "SQL Server" as DB
participant "Frontend" as FEB
actor "User B" as B

A -> FEA : Nhập tin nhắn & Gửi
FEA -> BE : POST /api/message/send
BE -> DB : Lưu tin nhắn (IsRead = false)
DB --> BE : Saved
BE -> Hub : Push Message to User B
Hub -> FEB : SignalR: ReceiveMessage
FEB -> B : Hiển thị tin nhắn tức thì
B -> FEB : Đọc tin nhắn
FEB -> BE : PUT /api/message/{id}/mark-as-read
BE -> DB : Update IsRead = true
@enduml
```

---

Sequence_Report_Management
## 8. Chức năng Quản lý Báo cáo (Report Management)
```plantuml
@startuml
actor "User (Reporter)" as U
participant "Frontend" as FEU
participant "API / Report" as BE
database "SQL Server" as DB
participant "Admin Dashboard" as FEA
actor "Admin" as A

U -> FEU : Chọn lý do & Gửi báo cáo
FEU -> BE : POST /api/report
BE -> DB : Lưu Report (Status: Pending)
DB --> BE : Success
BE --> FEU : Cảm ơn bạn đã báo cáo

A -> FEA : Xem danh sách Pending Reports
FEA -> BE : GET /api/report?status=Pending
BE -> DB : Query reports
DB --> BE : List of reports
BE --> FEA : Hiển thị danh sách

A -> FEA : Xử lý báo cáo (Duyệt/Bỏ qua)
FEA -> BE : PUT /api/report/{id}/status
BE -> DB : Cập nhật Status (Reviewed/Resolved)
DB --> BE : Updated
BE --> FEA : Cập nhật trạng thái UI
@enduml
```

---

Sequence_User_Management
## 9. Chức năng Quản lý Người dùng (Admin User Management)
```plantuml
@startuml
actor Admin
participant "Admin UI" as FE
participant "API / User" as BE
database "SQL Server" as DB

Admin -> FE : Tìm kiếm & Chọn User
FE -> BE : GET /api/user/{id}
BE -> DB : Lấy thông tin chi tiết
DB --> BE : User Data
BE --> FE : Hiển thị Profile User

Admin -> FE : Nhấn "Lock User" (Khóa tài khoản)
FE -> BE : POST /api/user/{id}/lock
BE -> DB : Cập nhật LockoutEnd
DB --> BE : Success
BE --> FE : Trạng thái: Đã khóa

Admin -> FE : Nhấn "Ban User" (Cấm vĩnh viễn)
FE -> BE : POST /api/user/{id}/ban
BE -> DB : Cập nhật IsBanned = true
DB --> BE : Success
BE --> FE : Trạng thái: Đã bị cấm
@enduml
```

---

Sequence_Search
## 10. Chức năng Tìm kiếm & Khám phá (Search & Discovery)
```plantuml
@startuml
actor User
participant "Frontend" as FE
participant "API / User" as BE
participant "API / Hashtag" as HB
database "SQL Server" as DB

User -> FE : Nhập từ khóa tìm kiếm
FE -> BE : GET /api/user/search?q={query}
BE -> DB : LIKE query users
DB --> BE : Danh sách kết quả
BE --> FE : Hiển thị User List

User -> FE : Nhấn vào một Hashtag (#...)
FE -> HB : GET /api/hashtag/{name}/posts
HB -> DB : Query Posts with Hashtag
DB --> HB : Danh sách bài viết
HB --> FE : Hiển thị Explore Feed
@enduml
```
