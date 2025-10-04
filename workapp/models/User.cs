using System.ComponentModel.DataAnnotations;

namespace workapp.Models
{
    public class User
    {
        [Key]
        public int UserId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(150)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Role { get; set; } = "seeker"; // 👈 ค่าเริ่มต้นเป็นผู้หางาน

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
