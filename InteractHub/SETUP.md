# InteractHub – Hướng dẫn setup (theo yêu cầu môn)

Tài liệu này hướng dẫn bạn tự dựng dự án InteractHub theo yêu cầu:
- Frontend: React 18 + TypeScript (strict) + Tailwind + React Router + Axios + React Hook Form
- Backend: ASP.NET Core 10 Web API + EF Core + Identity + JWT + SignalR + Swagger + Dapper
- Database: SQL Server
- Docker: backend, frontend, SQL Server
- Cloud: Azure (Blob Storage, deploy API/FE), CI/CD

> Lưu ý: Tài liệu chỉ hướng dẫn, bạn tự tạo dự án và cấu hình.

---

## 1) Cấu trúc thư mục đề xuất
```
InteractHub/
  frontend/            # React + TS
  backend/             # ASP.NET Core API
  docker/              # docker-compose, scripts
  SETUP.md
```

---

## 1.1) Checklist bắt buộc theo đề (Technology Stack)

### Frontend (SPA)
- React 18+ với TypeScript (strict)
- Tailwind CSS
- State management: React Context API **hoặc** Redux Toolkit
- React Router v6+
- HTTP client: Axios **hoặc** Fetch
- Build tool: Vite **hoặc** Create React App
- Libraries: React Hook Form, (tuỳ chọn) React Query
- Giao tiếp với backend qua RESTful API (JSON)

### Backend
- ASP.NET Core 8.0+ Web API
- RESTful API theo Repository + Service pattern
- ORM: Entity Framework Core 8+
- Database: SQL Server
- Auth: JWT + ASP.NET Core Identity
- Authorization: Role-based + Policy-based
- API docs: Swagger/OpenAPI
- CORS cấu hình cho React
- Real-time notifications: SignalR

### Cloud & DevOps
- Azure
- Azure Blob Storage cho ảnh
- CI/CD: Azure DevOps hoặc GitHub Actions

---

## 2) Backend – ASP.NET Core 10 Web API (hướng dẫn chi tiết)

### 2.1 Tạo solution + Web API
> Thực hiện trong thư mục `InteractHub/backend`.

1) Tạo solution
```
dotnet new sln -n InteractHub
```

2) Tạo Web API (.NET 10)
```
dotnet new webapi -n InteractHub.Api -f net10.0
```

3) Thêm project vào solution
```
dotnet sln InteractHub.sln add .\InteractHub.Api\InteractHub.Api.csproj
```

4) (Tuỳ chọn) Tạo thư mục chuẩn
```
cd .\InteractHub.Api
mkdir Controllers Services Repositories Data Models DTOs Auth SignalR
```

### 2.2 Cài package cần thiết (NuGet)
> Chạy trong thư mục `InteractHub.Api`.

```
dotnet add package Microsoft.EntityFrameworkCore
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Microsoft.AspNetCore.Identity.EntityFrameworkCore
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package Swashbuckle.AspNetCore
dotnet add package Microsoft.AspNetCore.SignalR
dotnet add package Dapper
```

### 2.3 Kiến trúc gợi ý
```
backend/
  InteractHub.Api/
    Controllers/
    Services/
    Repositories/
    Data/               # DbContext, Migrations
    Models/             # Entities
    DTOs/
    Auth/
    SignalR/
```

### 2.4 Cấu hình Identity + JWT
1) Tạo `ApplicationUser` (Models/ApplicationUser.cs)
- Kế thừa `IdentityUser`.

2) Tạo `ApplicationDbContext` (Data/ApplicationDbContext.cs)
- Kế thừa `IdentityDbContext<ApplicationUser>`.

3) Cấu hình chuỗi kết nối + JWT trong `appsettings.json`
Ví dụ:
```
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost,1433;Database=InteractHubDb;User Id=sa;Password=Your_password123;TrustServerCertificate=True"
},
"Jwt": {
  "Key": "YOUR_LONG_SECRET_KEY",
  "Issuer": "InteractHub",
  "Audience": "InteractHubClient",
  "ExpireMinutes": 60
}
```

4) Cấu hình services trong `Program.cs`
- Add DbContext
- Add Identity
- Add Authentication(JWT)
- Add Authorization

5) Middleware
- `UseAuthentication()` trước `UseAuthorization()`

### 2.5 EF Core + Dapper song song
- EF Core dùng cho CRUD thường.
- Dapper dùng cho truy vấn đặc thù (feed, trending hashtags).
- Dùng chung connection string.

Gợi ý: tạo `IDbConnection` factory và inject vào repository Dapper.

### 2.6 SignalR
1) Tạo `SignalR/NotificationHub.cs` kế thừa `Hub`.
2) Thêm `builder.Services.AddSignalR()`.
3) Map hub: `app.MapHub<NotificationHub>("/hubs/notifications")`.

### 2.7 Swagger + CORS
1) Swagger
- `builder.Services.AddEndpointsApiExplorer()`
- `builder.Services.AddSwaggerGen()`
- `app.UseSwagger()` + `app.UseSwaggerUI()` trong môi trường Dev.

2) CORS
- Tạo policy cho frontend origin (ví dụ http://localhost:5173).
- `app.UseCors("Frontend")`.

---

### 2.8 Migration & Database
1) Tạo migration
```
dotnet ef migrations add InitialCreate
```
2) Update database
```
dotnet ef database update
```

---

## 3) Frontend – React + TypeScript (hướng dẫn chi tiết)

### 3.1 Tạo app (Vite + React + TS)
> Thực hiện trong thư mục `InteractHub/frontend`.

1) Tạo Vite app
```
npm create vite@latest . -- --template react-ts
```

2) Cài dependencies
```
npm install
npm install react-router-dom axios react-hook-form
```

3) (Tuỳ chọn) React Query
```
npm install @tanstack/react-query
```

4) Bật strict mode
- Kiểm tra `tsconfig.json` có `"strict": true`.

### 3.2 Cài Tailwind CSS
```
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```
Trong `tailwind.config`:
```
content: ["./index.html", "./src/**/*.{ts,tsx}"]
```
Trong `src/index.css`:
```
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 3.3 Cấu trúc gợi ý
```
frontend/
  src/
    api/            # axios instance, endpoints
    components/
    pages/
    features/       # auth, posts, friends...
    hooks/
    layouts/
    routes/
    types/
```

### 3.4 Biến môi trường
Tạo `.env`:
```
VITE_API_URL=http://localhost:5000
```

---

## 4) Database – SQL Server (hướng dẫn chi tiết)

### 4.1 Local hoặc Docker
Bạn có 2 lựa chọn:
- Cài SQL Server local
- Dùng Docker SQL Server (khuyến nghị để đồng nhất môi trường)

Ví dụ Docker SQL Server:
```
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=Your_password123" \
  -p 1433:1433 --name interacthub-sql -d mcr.microsoft.com/mssql/server:2022-latest
```

### 4.2 Migration
1) Tạo migration
```
dotnet ef migrations add InitialCreate
```
2) Update database
```
dotnet ef database update
```
3) (Tuỳ chọn) Seed dữ liệu mẫu

---

## 5) Docker (hướng dẫn chi tiết)

### 5.1 Backend Dockerfile
Tạo `backend/InteractHub.Api/Dockerfile`:
```
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000
ENTRYPOINT ["dotnet", "InteractHub.Api.dll"]
```

### 5.2 Frontend Dockerfile
Tạo `frontend/Dockerfile`:
```
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

### 5.3 docker-compose
Tạo `docker/docker-compose.yml`:
```
version: "3.9"
services:
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=Your_password123
    ports:
      - "1433:1433"
    container_name: interacthub-sql

  api:
    build:
      context: ../backend/InteractHub.Api
      dockerfile: Dockerfile
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Server=sqlserver,1433;Database=InteractHubDb;User Id=sa;Password=Your_password123;TrustServerCertificate=True
      - Jwt__Key=YOUR_LONG_SECRET_KEY
      - Jwt__Issuer=InteractHub
      - Jwt__Audience=InteractHubClient
      - Jwt__ExpireMinutes=60
    ports:
      - "5000:5000"
    depends_on:
      - sqlserver

  web:
    build:
      context: ../frontend
      dockerfile: Dockerfile
    ports:
      - "5173:80"
    depends_on:
      - api
```

---

## 6) Azure + CI/CD (hướng dẫn chi tiết)

### 6.1 Azure
- API: App Service hoặc Container Apps.
- DB: Azure SQL.
- Storage: Azure Blob Storage (ảnh).

### 6.2 CI/CD
- GitHub Actions hoặc Azure DevOps.
- Pipeline build/test/deploy.

---

## 7) Checklist tính năng (theo đề)
- Đăng ký/Đăng nhập + JWT
- Post text + ảnh
- Stories (hết hạn)
- Like/Comment/Share
- Friend requests
- Notifications realtime (SignalR)
- Profile/Settings
- Trending hashtags
- Report/Moderation

---

## 8) Gợi ý thứ tự triển khai
1) Backend nền tảng (Auth + DbContext + Swagger + CORS)
2) CRUD Post/Comment/Like
3) Upload ảnh (Blob local trước, Azure sau)
4) SignalR Notifications
5) Frontend UI + Auth
6) Docker
7) CI/CD + Azure

---

Nếu bạn muốn mình bổ sung file hướng dẫn chi tiết cho phần nào sâu hơn (JWT, SignalR, Dapper repository/service, Azure Blob), hãy nói cụ thể.
