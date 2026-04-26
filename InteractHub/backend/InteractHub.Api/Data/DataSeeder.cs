using InteractHub.Api.Models;
using Microsoft.AspNetCore.Identity;

namespace InteractHub.Api.Data;

public static class DataSeeder
{
    public static async Task SeedUserAsync(IServiceProvider serviceProvider)
    {
        var userManager = serviceProvider.GetRequiredService<UserManager<User>>();

        // initial user  test data
        // user Admin Account
        var adminEmail = "admin@interacthub.com";
        if(await userManager.FindByEmailAsync(adminEmail) == null)
        {
            var newAdmin = new User
            {
                UserName = adminEmail,
                Email = adminEmail,
                FullName = "Ben Star",
                DateOfBirth = new DateTime(1990, 1, 1),
                Gender = Gender.male,
                EmailConfirmed = true
            };
            var result = await userManager.CreateAsync(newAdmin, "Admin@123");
            if(result.Succeeded) await userManager.AddToRoleAsync(newAdmin, "Admin");

        }

        // user normal account
        var userEmail = "user@interacthub.com";
        if(await userManager.FindByEmailAsync(userEmail) == null)
        {
            var newUser = new User
            {
                UserName = userEmail,
                Email = userEmail,
                FullName = "John Gaylord",
                DateOfBirth = new DateTime(1990, 1, 1),
                Gender = Gender.male,
                EmailConfirmed = true
            };
            var result = await userManager.CreateAsync(newUser, "User@123");
            if(result.Succeeded) await userManager.AddToRoleAsync(newUser, "User");
            
        }

    }

    public static async Task SeedPostsAsync(IServiceProvider serviceProvider)
    {
        var context = serviceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = serviceProvider.GetRequiredService<UserManager<User>>();

        // Get users for seeding
        var adminUser = await userManager.FindByEmailAsync("admin@interacthub.com");
        var normalUser = await userManager.FindByEmailAsync("user@interacthub.com");

        if (adminUser == null || normalUser == null) return;

        // Check if posts already exist
        if (context.Posts.Any()) return;

        var posts = new List<Post>
        {
            new Post
            {
                Id = Guid.NewGuid(),
                UserId = adminUser.Id,
                Content = "Xin chào mọi người! Đây là bài post đầu tiên của tôi trên InteractHub. Rất vui được kết nối với các bạn! 🎉",
                Visibility = Visibility.Public,
                Status = Status.active,
                CreatedAt = DateTime.UtcNow.AddDays(-5),
                UpdatedAt = DateTime.UtcNow.AddDays(-5)
            },
            new Post
            {
                Id = Guid.NewGuid(),
                UserId = normalUser.Id,
                Content = "Hôm nay mình có một ngày làm việc rất hiệu quả. Hoàn thành tất cả các dự án khó khăn. Cảm thấy tuyệt vời! 💪",
                Visibility = Visibility.Public,
                Status = Status.active,
                CreatedAt = DateTime.UtcNow.AddDays(-3),
                UpdatedAt = DateTime.UtcNow.AddDays(-3)
            },
            new Post
            {
                Id = Guid.NewGuid(),
                UserId = adminUser.Id,
                Content = "Chia sẻ một số tips về lập trình web. Học lập trình không chỉ là viết code, mà còn là hiểu rõ các nguyên tắc cơ bản.",
                Visibility = Visibility.Public,
                Status = Status.active,
                CreatedAt = DateTime.UtcNow.AddDays(-2),
                UpdatedAt = DateTime.UtcNow.AddDays(-2)
            },
            new Post
            {
                Id = Guid.NewGuid(),
                UserId = normalUser.Id,
                Content = "Vừa hoàn thành khóa học C# Advanced. Hình như mình đã sẵn sàng cho những project lớn hơn.",
                Visibility = Visibility.Public,
                Status = Status.active,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                UpdatedAt = DateTime.UtcNow.AddDays(-1)
            },
            new Post
            {
                Id = Guid.NewGuid(),
                UserId = adminUser.Id,
                Content = "Thứ 7 này có plan gì không? Ai muốn open hành trình khám phá những quán cà phê mới? 👥",
                Visibility = Visibility.Public,
                Status = Status.active,
                CreatedAt = DateTime.UtcNow.AddHours(-12),
                UpdatedAt = DateTime.UtcNow.AddHours(-12)
            },
            new Post
            {
                Id = Guid.NewGuid(),
                UserId = normalUser.Id,
                Content = "Mẹo nhanh: Sử dụng LINQ trong C# để xử lý dữ liệu collection một cách ef fectively. Rất tiện!",
                Visibility = Visibility.Public,
                Status = Status.active,
                CreatedAt = DateTime.UtcNow.AddHours(-6),
                UpdatedAt = DateTime.UtcNow.AddHours(-6)
            },
            new Post
            {
                Id = Guid.NewGuid(),
                UserId = adminUser.Id,
                Content = "Lần đầu tiên sử dụng Entity Framework Core với .NET 10. Performance rất tuyệt! 🚀",
                Visibility = Visibility.Public,
                Status = Status.active,
                CreatedAt = DateTime.UtcNow.AddHours(-2),
                UpdatedAt = DateTime.UtcNow.AddHours(-2)
            },
            new Post
            {
                Id = Guid.NewGuid(),
                UserId = normalUser.Id,
                Content = "Mới phát hành feature mới cho team. Khá hứng khởi với feedback từ các member! ✨",
                Visibility = Visibility.Public,
                Status = Status.active,
                CreatedAt = DateTime.UtcNow.AddMinutes(-30),
                UpdatedAt = DateTime.UtcNow.AddMinutes(-30)
            }
        };

        context.Posts.AddRange(posts);
        await context.SaveChangesAsync();
    }

    public static async Task SeedNotificationsAsync(IServiceProvider serviceProvider)
    {
        var context = serviceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = serviceProvider.GetRequiredService<UserManager<User>>();

        // Get users for seeding
        var adminUser = await userManager.FindByEmailAsync("admin@interacthub.com");
        var normalUser = await userManager.FindByEmailAsync("user@interacthub.com");

        if (adminUser == null || normalUser == null) return;

        // Check if notifications already exist
        if (context.Notifications.Any()) return;

        var notifications = new List<Notification>
        {
            new Notification
            {
                Id = Guid.NewGuid(),
                UserId = adminUser.Id,
                Content = "John Gaylord đã like bài post của bạn",
                Type = NotificationType.Like,
                IsRead = false,
                CreatedAt = DateTime.UtcNow.AddHours(-2),
                UpdatedAt = DateTime.UtcNow.AddHours(-2)
            },
            new Notification
            {
                Id = Guid.NewGuid(),
                UserId = adminUser.Id,
                Content = "John Gaylord đã comment trên bài post của bạn",
                Type = NotificationType.Comment,
                IsRead = false,
                CreatedAt = DateTime.UtcNow.AddHours(-1),
                UpdatedAt = DateTime.UtcNow.AddHours(-1)
            },
            new Notification
            {
                Id = Guid.NewGuid(),
                UserId = normalUser.Id,
                Content = "Ben Star đã like bài post của bạn",
                Type = NotificationType.Like,
                IsRead = true,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                UpdatedAt = DateTime.UtcNow.AddDays(-1)
            },
            new Notification
            {
                Id = Guid.NewGuid(),
                UserId = normalUser.Id,
                Content = "Ben Star đã comment: 'Bài viết rất hay!'",
                Type = NotificationType.Comment,
                IsRead = true,
                CreatedAt = DateTime.UtcNow.AddDays(-1).AddHours(-2),
                UpdatedAt = DateTime.UtcNow.AddDays(-1).AddHours(-2)
            },
            new Notification
            {
                Id = Guid.NewGuid(),
                UserId = adminUser.Id,
                Content = "John Gaylord share bài post của bạn",
                Type = NotificationType.Share,
                IsRead = false,
                CreatedAt = DateTime.UtcNow.AddMinutes(-30),
                UpdatedAt = DateTime.UtcNow.AddMinutes(-30)
            }
        };

        context.Notifications.AddRange(notifications);
        await context.SaveChangesAsync();
    }

    public static async Task SeedStoriesAsync(IServiceProvider serviceProvider)
    {
        var context = serviceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = serviceProvider.GetRequiredService<UserManager<User>>();

        var adminUser = await userManager.FindByEmailAsync("admin@interacthub.com");
        var normalUser = await userManager.FindByEmailAsync("user@interacthub.com");

        if (adminUser == null || normalUser == null) return;

        if (context.Stories.Any()) return;

        var stories = new List<Story>
        {
            new Story
            {
                Id = Guid.NewGuid(),
                UserId = adminUser.Id,
                StoryContent = "Morning coffee and planning the sprint.",
                MediaUrl = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085",
                CreatedAt = DateTime.UtcNow.AddHours(-3),
                UpdatedAt = DateTime.UtcNow.AddHours(-3),
                ExpireAt = DateTime.UtcNow.AddHours(21)
            },
            new Story
            {
                Id = Guid.NewGuid(),
                UserId = normalUser.Id,
                StoryContent = "Working on Story API integration.",
                MediaUrl = "https://images.unsplash.com/photo-1518773553398-650c184e0bb3",
                CreatedAt = DateTime.UtcNow.AddHours(-2),
                UpdatedAt = DateTime.UtcNow.AddHours(-2),
                ExpireAt = DateTime.UtcNow.AddHours(22)
            },
            new Story
            {
                Id = Guid.NewGuid(),
                UserId = adminUser.Id,
                StoryContent = "Deploy checklist completed.",
                MediaUrl = "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
                CreatedAt = DateTime.UtcNow.AddMinutes(-45),
                UpdatedAt = DateTime.UtcNow.AddMinutes(-45),
                ExpireAt = DateTime.UtcNow.AddHours(23).AddMinutes(15)
            }
        };

        context.Stories.AddRange(stories);
        await context.SaveChangesAsync();
    }
}