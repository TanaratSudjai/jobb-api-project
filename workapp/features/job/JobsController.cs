using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Security.Cryptography;
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

        private static string GenerateManageTokenRaw()
        {
            var bytes = RandomNumberGenerator.GetBytes(32);
            return Convert.ToBase64String(bytes)
                .Replace("+", string.Empty)
                .Replace("/", string.Empty)
                .Replace("=", string.Empty);
        }

        private async Task<string> GenerateUniqueManageTokenAsync()
        {
            string token;
            do
            {
                token = GenerateManageTokenRaw();
            } while (await _context.Jobs.AnyAsync(job => job.ManageToken == token));

            return token;
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
                jobsQuery = jobsQuery.Where(job => job.IsApproved && !job.IsClosed);
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

            if (!IsAdmin(role) && (!job.IsApproved || job.IsClosed))
            {
                return NotFound();
            }

            return Ok(job);
        }

        [HttpPost]
        public async Task<ActionResult<Job>> CreateJob([FromBody] JobCreateDto dto, [FromHeader(Name = RoleHeaderName)] string? role = null)
        {
            var manageToken = await GenerateUniqueManageTokenAsync();

            var job = new Job
            {
                Title = dto.Title,
                Description = dto.Description,
                Company = dto.Company ?? string.Empty,
                Location = dto.Location ?? string.Empty,
                JobType = dto.JobType ?? string.Empty,
                BudgetMin = dto.BudgetMin,
                BudgetMax = dto.BudgetMax,
                PosterName = dto.PosterName ?? string.Empty,
                PosterEmail = dto.PosterEmail ?? string.Empty,
                ManageToken = manageToken,
                ManageTokenExpiresAt = DateTime.UtcNow.AddDays(30),
                IsClosed = dto.IsClosed ?? false,
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
            job.JobType = dto.JobType ?? job.JobType;
            job.BudgetMin = dto.BudgetMin ?? job.BudgetMin;
            job.BudgetMax = dto.BudgetMax ?? job.BudgetMax;
            job.PosterName = dto.PosterName ?? job.PosterName;
            job.PosterEmail = dto.PosterEmail ?? job.PosterEmail;
            job.IsClosed = dto.IsClosed ?? job.IsClosed;

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

        [HttpPost("public")]
        public async Task<IActionResult> CreateJobPublic([FromBody] JobPublicCreateDto dto)
        {
            if (!dto.AcceptTerms)
            {
                return BadRequest(new { message = "ต้องยอมรับเงื่อนไขการใช้งานก่อนส่งประกาศ" });
            }

            var manageToken = await GenerateUniqueManageTokenAsync();

            var job = new Job
            {
                Title = dto.Title,
                Description = dto.Description,
                Company = dto.Company ?? string.Empty,
                Location = dto.Location ?? string.Empty,
                JobType = dto.JobType ?? string.Empty,
                BudgetMin = dto.BudgetMin,
                BudgetMax = dto.BudgetMax,
                PosterName = dto.PosterName ?? string.Empty,
                PosterEmail = dto.PosterEmail,
                ManageToken = manageToken,
                ManageTokenExpiresAt = DateTime.UtcNow.AddDays(30),
                IsApproved = false,
                IsClosed = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Jobs.Add(job);
            await _context.SaveChangesAsync();

            return Ok(new JobPublicResponseDto
            {
                Message = "ส่งประกาศงานเรียบร้อย ระบบจะตรวจสอบและแจ้งผลทางอีเมล",
                JobId = job.JobId,
                ManageToken = manageToken,
                ManageTokenExpiresAt = job.ManageTokenExpiresAt
            });
        }

        [HttpGet("manage/{token}")]
        public async Task<ActionResult<JobManageDto>> GetJobByToken(string token)
        {
            var job = await _context.Jobs.AsNoTracking().FirstOrDefaultAsync(job => job.ManageToken == token);
            if (job == null || job.ManageTokenExpiresAt < DateTime.UtcNow)
            {
                return NotFound(new { message = "ไม่พบลิงก์จัดการหรืออาจหมดอายุแล้ว" });
            }

            return Ok(JobManageDto.FromEntity(job));
        }

        [HttpPut("manage/{token}")]
        public async Task<IActionResult> UpdateJobByToken(string token, [FromBody] JobManageUpdateDto dto)
        {
            var job = await _context.Jobs.FirstOrDefaultAsync(job => job.ManageToken == token);
            if (job == null || job.ManageTokenExpiresAt < DateTime.UtcNow)
            {
                return NotFound(new { message = "ไม่พบลิงก์จัดการหรืออาจหมดอายุแล้ว" });
            }

            job.Title = dto.Title ?? job.Title;
            job.Description = dto.Description ?? job.Description;
            job.Company = dto.Company ?? job.Company;
            job.Location = dto.Location ?? job.Location;
            job.JobType = dto.JobType ?? job.JobType;
            job.BudgetMin = dto.BudgetMin ?? job.BudgetMin;
            job.BudgetMax = dto.BudgetMax ?? job.BudgetMax;
            job.IsClosed = dto.IsClosed ?? job.IsClosed;
            job.ManageTokenExpiresAt = DateTime.UtcNow.AddDays(30);
            job.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(JobManageDto.FromEntity(job));
        }

        [HttpDelete("manage/{token}")]
        public async Task<IActionResult> DeleteJobByToken(string token)
        {
            var job = await _context.Jobs.FirstOrDefaultAsync(job => job.ManageToken == token);
            if (job == null || job.ManageTokenExpiresAt < DateTime.UtcNow)
            {
                return NotFound(new { message = "ไม่พบลิงก์จัดการหรืออาจหมดอายุแล้ว" });
            }

            _context.Jobs.Remove(job);
            await _context.SaveChangesAsync();

            return Ok(new { message = "ลบประกาศงานเรียบร้อยแล้ว" });
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

            if (!job.IsApproved || job.IsClosed)
            {
                return BadRequest(new { message = "ประกาศงานนี้ไม่เปิดรับการติดต่อในขณะนี้" });
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

            if (job.IsClosed)
            {
                return BadRequest(new { message = "ประกาศงานนี้ถูกปิดแล้ว" });
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

        [MaxLength(100)]
        public string? JobType { get; set; }

        public decimal? BudgetMin { get; set; }
        public decimal? BudgetMax { get; set; }

        [MaxLength(200)]
        public string? PosterName { get; set; }

        [MaxLength(200)]
        [EmailAddress]
        public string? PosterEmail { get; set; }

        public bool? IsApproved { get; set; }
        public bool? IsClosed { get; set; }
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

        [MaxLength(100)]
        public string? JobType { get; set; }

        public decimal? BudgetMin { get; set; }
        public decimal? BudgetMax { get; set; }

        [MaxLength(200)]
        public string? PosterName { get; set; }

        [MaxLength(200)]
        [EmailAddress]
        public string? PosterEmail { get; set; }

        public bool? IsClosed { get; set; }
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

    public class JobPublicCreateDto
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

        [MaxLength(100)]
        public string? JobType { get; set; }

        public decimal? BudgetMin { get; set; }
        public decimal? BudgetMax { get; set; }

        [Required]
        [MaxLength(200)]
        [EmailAddress]
        public string PosterEmail { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? PosterName { get; set; }

        public bool AcceptTerms { get; set; }
    }

    public class JobPublicResponseDto
    {
        public string Message { get; set; } = string.Empty;
        public int JobId { get; set; }
        public string ManageToken { get; set; } = string.Empty;
        public DateTime ManageTokenExpiresAt { get; set; }
    }

    public class JobManageUpdateDto
    {
        [MaxLength(200)]
        public string? Title { get; set; }
        public string? Description { get; set; }

        [MaxLength(150)]
        public string? Company { get; set; }

        [MaxLength(150)]
        public string? Location { get; set; }

        [MaxLength(100)]
        public string? JobType { get; set; }

        public decimal? BudgetMin { get; set; }
        public decimal? BudgetMax { get; set; }

        public bool? IsClosed { get; set; }
    }

    public class JobManageDto
    {
        public int JobId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Company { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string JobType { get; set; } = string.Empty;
        public decimal? BudgetMin { get; set; }
        public decimal? BudgetMax { get; set; }
        public bool IsApproved { get; set; }
        public bool IsClosed { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public static JobManageDto FromEntity(Job job) => new()
        {
            JobId = job.JobId,
            Title = job.Title,
            Description = job.Description,
            Company = job.Company,
            Location = job.Location,
            JobType = job.JobType,
            BudgetMin = job.BudgetMin,
            BudgetMax = job.BudgetMax,
            IsApproved = job.IsApproved,
            IsClosed = job.IsClosed,
            CreatedAt = job.CreatedAt,
            UpdatedAt = job.UpdatedAt
        };
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
