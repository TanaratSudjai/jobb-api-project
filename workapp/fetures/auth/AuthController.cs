using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using workapp.Models;
using System.Security.Cryptography;
using System.Text;

namespace workapp.Features.Auth
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        // ==========================
        // POST: api/auth/register
        // ==========================
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] UserDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest(new { message = "Email นี้ถูกใช้งานแล้ว" });

            var user = new User
            {
                Name = dto.Name,
                Email = dto.Email,
                PasswordHash = HashPassword(dto.Password),
                Role = dto.Role ?? "seeker"
            };


            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "สมัครสมาชิกสำเร็จ", userId = user.UserId });
        }

        // ==========================
        // POST: api/auth/login
        // ==========================
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null || !VerifyPassword(dto.Password, user.PasswordHash))
                return Unauthorized(new { message = "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });

            return Ok(new { message = "เข้าสู่ระบบสำเร็จ", user });
        }

        // ==========================
        // Helper: Password Hash
        // ==========================
        private string HashPassword(string password)
        {
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(bytes);
        }

        private bool VerifyPassword(string password, string hash)
        {
            return HashPassword(password) == hash;
        }
    }

    // DTOs
    public class UserDto
    {
        public string Name { get; set; } = "";
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";
        public string Role { get; set; } = "seeker"; // 👈 เพิ่มตรงนี้
    }


    public class LoginDto
    {
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";
    }
}
