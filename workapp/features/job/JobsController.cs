using System.ComponentModel.DataAnnotations;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using workapp.Models;

namespace workapp.Features.Jobs
{
    [ApiController]
    [Route("api/[controller]")]
    public class JobsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private const string AdminRole = "admin";
        private const string RoleHeaderName = "X-User-Role";

        public JobsController(AppDbContext context)
        {
            _context = context;
        }

        private static bool IsAdmin(string? role) =>
            !string.IsNullOrWhiteSpace(role) &&
            string.Equals(role, AdminRole, StringComparison.OrdinalIgnoreCase);

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Job>>> GetJobs([FromHeader(Name = RoleHeaderName)] string? role = null)
        {
            var isAdmin = IsAdmin(role);
            var jobsQuery = _context.Jobs.AsNoTracking().AsQueryable();

            if (!isAdmin)
            {
                jobsQuery = jobsQuery.Where(job => job.IsApproved);
            }

            var jobs = await jobsQuery
                .OrderByDescending(job => job.CreatedAt)
                .ToListAsync();

            return Ok(jobs);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<Job>> GetJob(int id, [FromHeader(Name = RoleHeaderName)] string? role = null)
        {
            var job = await _context.Jobs.AsNoTracking().FirstOrDefaultAsync(job => job.JobId == id);
            if (job == null)
            {
                return NotFound();
            }

            if (!IsAdmin(role) && !job.IsApproved)
            {
                return NotFound();
            }

            return Ok(job);
        }

        [HttpPost]
        public async Task<ActionResult<Job>> CreateJob([FromBody] JobCreateDto dto, [FromHeader(Name = RoleHeaderName)] string? role = null)
        {
            var job = new Job
            {
                Title = dto.Title,
                Description = dto.Description,
                Company = dto.Company ?? string.Empty,
                Location = dto.Location ?? string.Empty,
                IsApproved = IsAdmin(role) && dto.IsApproved == true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Jobs.Add(job);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetJob), new { id = job.JobId }, job);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateJob(int id, [FromBody] JobUpdateDto dto, [FromHeader(Name = RoleHeaderName)] string? role = null)
        {
            var job = await _context.Jobs.FirstOrDefaultAsync(job => job.JobId == id);
            if (job == null)
            {
                return NotFound();
            }

            job.Title = dto.Title ?? job.Title;
            job.Description = dto.Description ?? job.Description;
            job.Company = dto.Company ?? job.Company;
            job.Location = dto.Location ?? job.Location;

            if (dto.IsApproved.HasValue)
            {
                if (!IsAdmin(role))
                {
                    return Forbid();
                }

                job.IsApproved = dto.IsApproved.Value;
            }

            job.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(job);
        }

        [HttpPut("{id:int}/status")]
        public async Task<IActionResult> UpdateJobStatus(int id, [FromBody] JobStatusUpdateDto dto, [FromHeader(Name = RoleHeaderName)] string? role = null)
        {
            if (!IsAdmin(role))
            {
                return Forbid();
            }

            var job = await _context.Jobs.FirstOrDefaultAsync(job => job.JobId == id);
            if (job == null)
            {
                return NotFound();
            }

            job.IsApproved = dto.IsApproved;
            job.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "อัปเดตสถานะประกาศงานสำเร็จ", job.JobId, job.IsApproved });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteJob(int id, [FromHeader(Name = RoleHeaderName)] string? role = null)
        {
            if (!IsAdmin(role))
            {
                return Forbid();
            }

            var job = await _context.Jobs.FirstOrDefaultAsync(job => job.JobId == id);
            if (job == null)
            {
                return NotFound();
            }

            _context.Jobs.Remove(job);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("{id:int}/contacts")]
        public async Task<ActionResult<IEnumerable<JobContact>>> GetJobContacts(int id, [FromHeader(Name = RoleHeaderName)] string? role = null)
        {
            if (!IsAdmin(role))
            {
                return Forbid();
            }

            var jobExists = await _context.Jobs.AnyAsync(job => job.JobId == id);
            if (!jobExists)
            {
                return NotFound();
            }

            var contacts = await _context.JobContacts
                .AsNoTracking()
                .Where(contact => contact.JobId == id)
                .OrderByDescending(contact => contact.CreatedAt)
                .ToListAsync();

            return Ok(contacts);
        }

        [HttpPost("{id:int}/contacts")]
        public async Task<IActionResult> CreateJobContact(int id, [FromBody] JobContactCreateDto dto)
        {
            var job = await _context.Jobs.AsNoTracking().FirstOrDefaultAsync(job => job.JobId == id);
            if (job == null)
            {
                return NotFound(new { message = "ไม่พบประกาศงานที่ต้องการติดต่อ" });
            }

            if (!job.IsApproved)
            {
                return BadRequest(new { message = "ประกาศงานนี้ยังไม่เปิดให้ติดต่อ" });
            }

            var contact = new JobContact
            {
                JobId = job.JobId,
                Name = dto.Name,
                Email = dto.Email,
                Phone = dto.Phone,
                Message = dto.Message,
                CreatedAt = DateTime.UtcNow
            };

            _context.JobContacts.Add(contact);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "ส่งคำขอติดต่อเรียบร้อยแล้ว",
                contact.JobContactId,
                contact.JobId
            });
        }

        [HttpGet("{id:int}/reports")]
        public async Task<ActionResult<IEnumerable<JobReport>>> GetJobReports(int id, [FromHeader(Name = RoleHeaderName)] string? role = null)
        {
            if (!IsAdmin(role))
            {
                return Forbid();
            }

            var jobExists = await _context.Jobs.AnyAsync(job => job.JobId == id);
            if (!jobExists)
            {
                return NotFound();
            }

            var reports = await _context.JobReports
                .AsNoTracking()
                .Where(report => report.JobId == id)
                .OrderBy(report => report.IsResolved)
                .ThenByDescending(report => report.CreatedAt)
                .ToListAsync();

            return Ok(reports);
        }

        [HttpGet("reports")]
        public async Task<ActionResult<IEnumerable<JobReportSummaryDto>>> GetAllJobReports([FromHeader(Name = RoleHeaderName)] string? role = null)
        {
            if (!IsAdmin(role))
            {
                return Forbid();
            }

            var reports = await _context.JobReports
                .AsNoTracking()
                .Include(report => report.Job)
                .OrderBy(report => report.IsResolved)
                .ThenByDescending(report => report.CreatedAt)
                .Select(report => new JobReportSummaryDto
                {
                    JobReportId = report.JobReportId,
                    JobId = report.JobId,
                    JobTitle = report.Job != null ? report.Job.Title : string.Empty,
                    JobCompany = report.Job != null ? report.Job.Company : string.Empty,
                    ReporterEmail = report.ReporterEmail,
                    ReporterName = report.ReporterName,
                    Reason = report.Reason,
                    Description = report.Description,
                    IsResolved = report.IsResolved,
                    CreatedAt = report.CreatedAt,
                    ResolvedAt = report.ResolvedAt
                })
                .ToListAsync();

            return Ok(reports);
        }

        [HttpPost("{id:int}/reports")]
        public async Task<IActionResult> CreateJobReport(int id, [FromBody] JobReportCreateDto dto)
        {
            var job = await _context.Jobs.AsNoTracking().FirstOrDefaultAsync(job => job.JobId == id);
            if (job == null || !job.IsApproved)
            {
                return NotFound(new { message = "ไม่พบประกาศงานที่ต้องการรายงาน" });
            }

            var report = new JobReport
            {
                JobId = job.JobId,
                ReporterName = dto.Name ?? string.Empty,
                ReporterEmail = dto.Email,
                Reason = dto.Reason,
                Description = dto.Description,
                CreatedAt = DateTime.UtcNow
            };

            _context.JobReports.Add(report);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "ส่งรายงานประกาศงานสำเร็จ",
                report.JobReportId,
                report.JobId
            });
        }

        [HttpPut("{jobId:int}/reports/{reportId:int}/resolve")]
        public async Task<IActionResult> ResolveJobReport(int jobId, int reportId, [FromBody] JobReportResolveDto dto, [FromHeader(Name = RoleHeaderName)] string? role = null)
        {
            if (!IsAdmin(role))
            {
                return Forbid();
            }

            var report = await _context.JobReports.FirstOrDefaultAsync(report => report.JobId == jobId && report.JobReportId == reportId);
            if (report == null)
            {
                return NotFound(new { message = "ไม่พบรายงานดังกล่าว" });
            }

            report.IsResolved = dto.IsResolved;
            report.ResolvedAt = dto.IsResolved ? DateTime.UtcNow : null;

            await _context.SaveChangesAsync();
            return Ok(new
            {
                message = dto.IsResolved ? "ปิดรายงานเรียบร้อย" : "เปิดรายงานอีกครั้ง",
                report.JobReportId,
                report.IsResolved
            });
        }
    }

    public class JobCreateDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [MaxLength(150)]
        public string? Company { get; set; }

        [MaxLength(150)]
        public string? Location { get; set; }

        public bool? IsApproved { get; set; }
    }

    public class JobUpdateDto
    {
        [MaxLength(200)]
        public string? Title { get; set; }
        public string? Description { get; set; }

        [MaxLength(150)]
        public string? Company { get; set; }

        [MaxLength(150)]
        public string? Location { get; set; }

        public bool? IsApproved { get; set; }
    }

    public class JobStatusUpdateDto
    {
        [Required]
        public bool IsApproved { get; set; }
    }

    public class JobContactCreateDto
    {
        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [MaxLength(30)]
        public string? Phone { get; set; }

        [MaxLength(500)]
        public string? Message { get; set; }
    }

    public class JobReportCreateDto
    {
        [Required]
        [MaxLength(200)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [MaxLength(150)]
        public string? Name { get; set; }

        [Required]
        [MaxLength(150)]
        public string Reason { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }
    }

    public class JobReportResolveDto
    {
        [Required]
        public bool IsResolved { get; set; }
    }

    public class JobReportSummaryDto
    {
        public int JobReportId { get; set; }
        public int JobId { get; set; }
        public string JobTitle { get; set; } = string.Empty;
        public string JobCompany { get; set; } = string.Empty;
        public string ReporterEmail { get; set; } = string.Empty;
        public string ReporterName { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsResolved { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
    }
}
