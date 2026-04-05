using Markopilot.Api.Middleware;
using Markopilot.Infrastructure.Supabase;
using Microsoft.AspNetCore.Mvc;

namespace Markopilot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BrandsController : ControllerBase
{
    private readonly SupabaseRepository _repo;
    private readonly ILogger<BrandsController> _logger;

    public BrandsController(SupabaseRepository repo, ILogger<BrandsController> logger)
    {
        _repo = repo;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = HttpContext.GetUserId();
        var brands = await _repo.GetBrandsByOwnerAsync(userId);
        return Ok(brands);
    }

    [HttpGet("{brandId:guid}")]
    public async Task<IActionResult> GetById(Guid brandId)
    {
        var userId = HttpContext.GetUserId();
        var brand = await _repo.GetBrandByIdAsync(brandId, userId);
        if (brand == null) return NotFound(new { error = new { code = "NOT_FOUND", message = "Brand not found" } });
        return Ok(brand);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Core.Models.Brand brand)
    {
        var userId = HttpContext.GetUserId();
        brand.OwnerId = userId;
        var created = await _repo.CreateBrandAsync(brand);
        return CreatedAtAction(nameof(GetById), new { brandId = created.Id }, created);
    }

    [HttpPut("{brandId:guid}")]
    public async Task<IActionResult> Update(Guid brandId, [FromBody] Core.Models.Brand brand)
    {
        var userId = HttpContext.GetUserId();
        // Assume repo.UpdateBrandAsync exists
        var existing = await _repo.GetBrandByIdAsync(brandId, userId);
        if (existing == null) return NotFound(new { error = new { code = "NOT_FOUND", message = "Brand not found" } });
        
        brand.Id = brandId;
        brand.OwnerId = userId;
        var updated = await _repo.UpdateBrandAsync(brand);
        return Ok(updated);
    }
}
