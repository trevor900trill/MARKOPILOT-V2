using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.AspNetCore.Mvc;

namespace Markopilot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AiController : ControllerBase
{
    private readonly IContentGenerationService _contentService;
    private readonly ILogger<AiController> _logger;

    public AiController(IContentGenerationService contentService, ILogger<AiController> logger)
    {
        _contentService = contentService;
        _logger = logger;
    }

    // Deployment trigger: force rebuild of API service
    [HttpPost("enhance-onboarding")]
    public async Task<IActionResult> EnhanceOnboarding([FromBody] EnhanceOnboardingRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Description))
        {
            return BadRequest(new { error = "Description is required" });
        }

        try
        {
            var result = await _contentService.EnhanceOnboardingAsync(request.Description);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to enhance onboarding description");
            return StatusCode(500, new { error = "AI enhancement failed" });
        }
    }
}
