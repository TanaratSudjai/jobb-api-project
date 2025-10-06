using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace workapp.Models
{
    public class JobReport
    {
        [Key]
        public int JobReportId { get; set; }

        [Required]
        [ForeignKey(nameof(Job))]
        public int JobId { get; set; }

        public Job? Job { get; set; }

        [MaxLength(150)]
        public string ReporterName { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        [EmailAddress]
        public string ReporterEmail { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        public string Reason { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        public bool IsResolved { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ResolvedAt { get; set; }
    }
}
