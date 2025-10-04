using Microsoft.EntityFrameworkCore;
using workapp.Models;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(builder.Configuration.GetConnectionString("DefaultConnection"),
    new MySqlServerVersion(new Version(8, 0, 36)))); // หรือเปลี่ยนตามเวอร์ชัน MySQL

builder.Services.AddControllers();

var app = builder.Build();
app.MapControllers();
app.Run();
