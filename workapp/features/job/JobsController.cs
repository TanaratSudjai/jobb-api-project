using System.ComponentModel.DataAnnotations;
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
}
