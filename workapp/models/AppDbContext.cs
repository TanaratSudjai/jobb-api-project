using Microsoft.EntityFrameworkCore;

namespace workapp.Models
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }   // 👈 เพิ่มตรงนี้
    }
}
