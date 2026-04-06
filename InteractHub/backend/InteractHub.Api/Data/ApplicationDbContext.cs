using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

public class ApplicationDbContext : IdentityDbContext<User, Microsoft.AspNetCore.Identity.IdentityRole<int>, int>
{
	public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
	{
	}

	public DbSet<User> UsersTable => Set<User>();
	public DbSet<Post> Posts => Set<Post>();
	public DbSet<Comment> Comments => Set<Comment>();
	public DbSet<Like> Likes => Set<Like>();
	public DbSet<Share> Shares => Set<Share>();
	public DbSet<Story> Stories => Set<Story>();
	public DbSet<HashTag> HashTags => Set<HashTag>();
	public DbSet<Notification> Notifications => Set<Notification>();
	public DbSet<FriendShip> FriendShips => Set<FriendShip>();
	public DbSet<Message> Messages => Set<Message>();
	public DbSet<PostReport> PostReports => Set<PostReport>();

	protected override void OnModelCreating(ModelBuilder builder)
	{
		base.OnModelCreating(builder);

		builder.Entity<User>(entity =>
		{
			entity.HasMany(u => u.Posts)
				.WithOne(p => p.user)
				.HasForeignKey(p => p.UserId)
				.OnDelete(DeleteBehavior.Cascade);
		});

		builder.Entity<Post>(entity =>
		{
			entity.HasMany(p => p.Comments)
				.WithOne(c => c.Post)
				.HasForeignKey(c => c.PostId)
				.OnDelete(DeleteBehavior.Cascade);

			entity.HasMany(p => p.Likes)
				.WithOne(l => l.Post)
				.HasForeignKey(l => l.PostId)
				.OnDelete(DeleteBehavior.Cascade);

			entity.HasMany(p => p.Shares)
				.WithOne(s => s.Post)
				.HasForeignKey(s => s.PostId)
				.OnDelete(DeleteBehavior.Cascade);

			entity.HasMany(p => p.HashTags)
				.WithMany(h => h.Posts)
				.UsingEntity<Dictionary<string, object>>(
					"PostHashTags",
					j => j.HasOne<HashTag>().WithMany().HasForeignKey("HashTagId").OnDelete(DeleteBehavior.Cascade),
					j => j.HasOne<Post>().WithMany().HasForeignKey("PostId").OnDelete(DeleteBehavior.Cascade));
		});

		builder.Entity<Comment>(entity =>
		{
			entity.HasOne(c => c.user)
				.WithMany()
				.HasForeignKey(c => c.UserId)
				.OnDelete(DeleteBehavior.Restrict);
		});

		builder.Entity<Like>(entity =>
		{
			entity.HasOne(l => l.user)
				.WithMany()
				.HasForeignKey(l => l.UserId)
				.OnDelete(DeleteBehavior.Restrict);
		});

		builder.Entity<Share>(entity =>
		{
			entity.HasOne(s => s.user)
				.WithMany()
				.HasForeignKey(s => s.UserId)
				.OnDelete(DeleteBehavior.Restrict);
		});

		builder.Entity<Story>(entity =>
		{
			entity.HasOne(s => s.user)
				.WithMany()
				.HasForeignKey(s => s.UserId)
				.OnDelete(DeleteBehavior.Cascade);
		});

		builder.Entity<Notification>(entity =>
		{
			entity.HasOne(n => n.user)
				.WithMany()
				.HasForeignKey(n => n.UserId)
				.OnDelete(DeleteBehavior.Cascade);
		});

		builder.Entity<FriendShip>(entity =>
		{
			entity.HasOne(f => f.Requester)
				.WithMany(u => u.SentFriendRequests)
				.HasForeignKey(f => f.RequesterId)
				.OnDelete(DeleteBehavior.Restrict);

			entity.HasOne(f => f.Receiver)
				.WithMany(u => u.ReceivedFriendRquests)
				.HasForeignKey(f => f.ReceiverId)
				.OnDelete(DeleteBehavior.Restrict);
		});

		builder.Entity<Message>(entity =>
		{
			entity.HasOne(m => m.Sender)
				.WithMany()
				.HasForeignKey(m => m.SenderId)
				.OnDelete(DeleteBehavior.Restrict);

			entity.HasOne(m => m.Receiver)
				.WithMany()
				.HasForeignKey(m => m.ReceiverId)
				.OnDelete(DeleteBehavior.Restrict);
		});

		builder.Entity<PostReport>(entity =>
		{
			entity.HasOne(pr => pr.Post)
				.WithMany()
				.HasForeignKey(pr => pr.PostId)
				.OnDelete(DeleteBehavior.Cascade);
		});
	}
}
