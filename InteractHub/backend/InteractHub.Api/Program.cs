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

var builder = WebApplication.CreateBuilder(args);

// 1. Đăng ký Controllers
builder.Services.AddControllers();

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
              .AllowCredentials();
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
});
builder.Services.AddAuthorization();

// 7. Đăng ký Services & Generic Repository
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));

var app = builder.Build();

// 8. Cấu hình HTTP Request Pipeline
if (app.Environment.IsDevelopment())
{
    // Kích hoạt Swagger UI chuẩn
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// KÍCH HOẠT CORS (Lưu ý: Bắt buộc phải đặt TRƯỚC UseAuthentication)
app.UseCors("ReactCorsPolicy");

// 9. Kích hoạt Middleware Xác thực & Phân quyền
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// 10. Chạy Seeder
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        await DataSeeder.SeedUserAsync(services);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Có lỗi khi seed data: {ex.Message}");
    }
}

app.Run();