using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace workapp.Models
{
    public class Job
    {
        [Key]
        public int JobId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [MaxLength(150)]
        public string Company { get; set; } = string.Empty;

        [MaxLength(150)]
        public string Location { get; set; } = string.Empty;

        [MaxLength(100)]
        public string JobType { get; set; } = string.Empty;

        public decimal? BudgetMin { get; set; }
        public decimal? BudgetMax { get; set; }

        [MaxLength(200)]
        public string PosterName { get; set; } = string.Empty;

        [MaxLength(200)]
        public string PosterEmail { get; set; } = string.Empty;

        [MaxLength(200)]
        public string ManageToken { get; set; } = string.Empty;

        public DateTime ManageTokenExpiresAt { get; set; } = DateTime.UtcNow.AddDays(30);

        public bool IsClosed { get; set; } = false;

        public bool IsApproved { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<JobContact> Contacts { get; set; } = new List<JobContact>();
        public ICollection<JobReport> Reports { get; set; } = new List<JobReport>();
    }
}
