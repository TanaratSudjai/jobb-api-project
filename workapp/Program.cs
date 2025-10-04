using Microsoft.EntityFrameworkCore;
using workapp.Models;

var builder = WebApplication.CreateBuilder(args);

const string CorsPolicyName = "FrontendCors";

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(builder.Configuration.GetConnectionString("DefaultConnection"),
    new MySqlServerVersion(new Version(8, 0, 36)))); 



// use cors
builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicyName, policy =>
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

builder.Services.AddControllers();

var app = builder.Build();

app.UseCors(CorsPolicyName);

app.MapControllers();
app.Run();
