using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using InteractHub.Api.Models;
namespace InteractHub.Api.Data;

public class ApplicationDbContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    // Đăng ký các bảng dữ liệu (Requirement B1)
    public DbSet<Post> Posts { get; set; }
    public DbSet<PostMedia> PostMedias { get; set; }
    public DbSet<HashTag> HashTags { get; set; }
    public DbSet<Comment> Comments { get; set; }
    public DbSet<Like> Likes { get; set; }
    public DbSet<Share> Shares { get; set; }
    public DbSet<SavedPost> SavedPosts { get; set; }
    public DbSet<FriendShip> FriendShips { get; set; }
    public DbSet<Message> Messages { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<PostReport> PostReports { get; set; }
    public DbSet<Story> Stories { get; set; }
    public DbSet<ActivityLog> ActivityLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        // Phải gọi base để cấu hình các bảng Identity mặc định
        base.OnModelCreating(builder);

        // 1. Cấu hình FriendShip (Quan hệ giữa User - User)
        builder.Entity<FriendShip>()
            .HasOne(f => f.Requester)
            .WithMany() 
            .HasForeignKey(f => f.RequesterId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<FriendShip>()
            .HasOne(f => f.Receiver)
            .WithMany(u => u.Friendships)
            .HasForeignKey(f => f.ReceiverId)
            .OnDelete(DeleteBehavior.Restrict);

        // 2. Cấu hình Message (Gửi và Nhận)
        builder.Entity<Message>()
            .HasOne(m => m.Sender)
            .WithMany(u => u.SentMessages)
            .HasForeignKey(m => m.SenderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Message>()
            .HasOne(m => m.Receiver)
            .WithMany(u => u.ReceivedMessages)
            .HasForeignKey(m => m.ReceiverId)
            .OnDelete(DeleteBehavior.Restrict);

        // 3. Chặn xóa dây chuyền (Cascade) từ User để tránh lỗi SQL Server
        // Áp dụng cho các bảng có khóa ngoại trực tiếp tới User
        builder.Entity<Comment>().HasOne(c => c.User).WithMany().HasForeignKey(c => c.UserId).OnDelete(DeleteBehavior.Restrict);
        builder.Entity<Like>().HasOne(l => l.User).WithMany().HasForeignKey(l => l.UserId).OnDelete(DeleteBehavior.Restrict);
        builder.Entity<Share>().HasOne(s => s.User).WithMany().HasForeignKey(s => s.UserId).OnDelete(DeleteBehavior.Restrict);
        builder.Entity<SavedPost>().HasOne(sp => sp.User).WithMany().HasForeignKey(sp => sp.UserId).OnDelete(DeleteBehavior.Restrict);
        builder.Entity<PostReport>().HasOne(pr => pr.User).WithMany().HasForeignKey(pr => pr.UserId).OnDelete(DeleteBehavior.Restrict);
        builder.Entity<Story>().HasOne(s => s.User).WithMany().HasForeignKey(s => s.UserId).OnDelete(DeleteBehavior.Restrict);

        // 4. Cấu hình quan hệ Nhiều-Nhiều giữa Post và HashTag (Requirement B1)
        builder.Entity<Post>()
            .HasMany(p => p.HashTags)
            .WithMany();

        // 4b. Cấu hình ActivityLog relationships
        builder.Entity<ActivityLog>()
            .HasOne(al => al.Admin)
            .WithMany(u => u.ActivityLogs)
            .HasForeignKey(al => al.AdminId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<ActivityLog>()
            .HasOne(al => al.TargetUser)
            .WithMany()
            .HasForeignKey(al => al.TargetUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // 5. Khởi tạo dữ liệu Role mẫu (Role Seeding - Requirement B3)
        // Đổi từ Guid.NewGuid() sang Guid.Parse() với các giá trị cố định
        Guid adminRoleId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid userRoleId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        builder.Entity<IdentityRole<Guid>>().HasData(
            new IdentityRole<Guid>
            {
                Id = adminRoleId,
                Name = "Admin",
                NormalizedName = "ADMIN",
                ConcurrencyStamp = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
            },
            new IdentityRole<Guid>
            {
                Id = userRoleId,
                Name = "User",
                NormalizedName = "USER",
                ConcurrencyStamp = "b1c2d3e4-f5a6-4b7c-8d9e-1f2a3b4c5d6e"
            }
        );
    }
}