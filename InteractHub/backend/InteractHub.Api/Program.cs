using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models; // BẮT BUỘC CÓ DÒNG NÀY CHO SWAGGER
using System.Text;
using InteractHub.Api.Data;
using InteractHub.Api.Models;
using InteractHub.Api.Services;
using InteractHub.Api.Repositories;
using InteractHub.Api.Services.Interface;
using InteractHub.Api.Services.Implementation;
using InteractHub.Api.Hubs;

var builder = WebApplication.CreateBuilder(args);

// 1. Đăng ký Controllers
builder.Services.AddControllers();

// SignalR for real-time messaging
builder.Services.AddSignalR();

// 2. CẤU HÌNH SWAGGER (Chuẩn yêu cầu của đồ án)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "InteractHub API", Version = "v1" });
    
    // Tạo nút Authorize (Ổ khóa) để nhập JWT Token
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Nhập token theo cú pháp: Bearer {token của bạn}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            new string[] {}
        }
    });
});

// 3. CẤU HÌNH CORS (Bắt buộc để React gọi được API)
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactCorsPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174") 
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();  // Required for SignalR
    });
});

// 4. Đăng ký EF Core & Dapper
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<DataContextDapper>();

// 5. Đăng ký Identity & CẤU HÌNH ĐỘ KHÓ MẬT KHẨU
builder.Services.AddIdentity<User, IdentityRole<Guid>>(options => 
{
    options.Password.RequireDigit = true; 
    options.Password.RequiredLength = 8;  
    options.Password.RequireNonAlphanumeric = true; 
    options.Password.RequireUppercase = true; 
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// 6. Cấu hình xác thực JWT
builder.Services.AddAuthentication(options => {
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options => {
    options.TokenValidationParameters = new TokenValidationParameters {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
    };
    // SignalR cần lấy token từ query string
    options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});
builder.Services.AddAuthorization();

// 7. Đăng ký Services & Generic Repository
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<IPostService, PostService>(); // BỔ SUNG DÒNG NÀY
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IFileUploadService, FileUploadService>(); 
builder.Services.AddScoped<ILikeService, LikeService>();
builder.Services.AddScoped<ICommentService, CommentService>();
builder.Services.AddScoped<IShareService, ShareService>();
builder.Services.AddScoped<ISavedPostService, SavedPostService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IStoryService, StoryService>();
builder.Services.AddScoped<IFriendshipService, FriendshipService>();
builder.Services.AddScoped<IMessageService, MessageService>();

// 7b. Đăng ký Admin Services
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IAdminDashboardService, AdminDashboardService>();
builder.Services.AddScoped<IAdminPostService, AdminPostService>();
builder.Services.AddScoped<IActivityLogService, ActivityLogService>();

builder.Services.AddHostedService<MediaCleanupService>();

// Đăng ký FileUploadService để sau này có thể inject vào Controller hoặc Service khác khi cần thiết.

// Lưu ý: Sau này bạn làm thêm các Service khác như FriendsService, StoriesService... 
// theo Requirement B4 thì cũng nhớ đăng ký tiếp vào ngay bên dưới nhé.

var app = builder.Build();

// 8. Cấu hình HTTP Request Pipeline
if (app.Environment.IsDevelopment())
{
    // Kích hoạt Swagger UI chuẩn
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

// KÍCH HOẠT CORS (Lưu ý: Bắt buộc phải đặt TRƯỚC UseAuthentication)
app.UseCors("ReactCorsPolicy");

// 9. Kích hoạt Middleware Xác thực & Phân quyền
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");

// 10. Chạy Seeder
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var db = services.GetRequiredService<ApplicationDbContext>();
        await db.Database.ExecuteSqlRawAsync(@"
            IF COL_LENGTH('AspNetUsers', 'CreatedAt') IS NULL
            BEGIN
                ALTER TABLE [AspNetUsers]
                ADD [CreatedAt] datetime2 NOT NULL
                    CONSTRAINT [DF_AspNetUsers_CreatedAt] DEFAULT SYSUTCDATETIME();
            END
        ");

        await DataSeeder.SeedUserAsync(services);
        await DataSeeder.SeedPostsAsync(services);
        await DataSeeder.SeedNotificationsAsync(services);
        await DataSeeder.SeedStoriesAsync(services);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Có lỗi khi seed data: {ex.Message}");
    }
}

app.Run();