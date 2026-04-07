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
}