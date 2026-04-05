using Markopilot.Api.Middleware;
using Markopilot.Infrastructure.Supabase;
using Markopilot.Core.Interfaces;
using Markopilot.Infrastructure.Social;
using Microsoft.AspNetCore.Mvc;

namespace Markopilot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SocialController : ControllerBase
{
    private readonly OAuthService _oauthService;
    private readonly ITokenEncryptionService _encryptionService;
    private readonly IConfiguration _config;
    private readonly ILogger<SocialController> _logger;
    private readonly SupabaseRepository _repo;

    public SocialController(
        OAuthService oauthService,
        ITokenEncryptionService encryptionService,
        IConfiguration config,
        ILogger<SocialController> logger,
        SupabaseRepository repo)
    {
        _oauthService = oauthService;
        _encryptionService = encryptionService;
        _config = config;
        _logger = logger;
        _repo = repo;
    }

    [HttpGet("{brandId:guid}/posts")]
    public async Task<IActionResult> GetPosts(Guid brandId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var ownerId = HttpContext.GetUserId();
        var result = await _repo.GetPostsByBrandAsync(brandId, ownerId, page, pageSize);
        return Ok(new { data = result, total = result.Count, page, pageSize, totalPages = 1 });
    }

    [HttpPost("{brandId:guid}/posts")]
    public async Task<IActionResult> CreatePost(Guid brandId, [FromBody] Markopilot.Core.Models.SocialPost post)
    {
        var ownerId = HttpContext.GetUserId();
        if (ownerId == Guid.Empty) return Unauthorized();

        post.Id = Guid.NewGuid();
        post.BrandId = brandId;
        post.Status = "queued";
        post.GeneratedAt = DateTimeOffset.UtcNow;
        
        await _repo.CreatePostAsync(post);
        return Ok(post);
    }

    [HttpDelete("{brandId:guid}/posts/{postId:guid}")]
    public async Task<IActionResult> CancelPost(Guid brandId, Guid postId)
    {
        var ownerId = HttpContext.GetUserId();
        await _repo.CancelPostAsync(postId, ownerId);
        return NoContent();
    }

    [HttpGet("{brandId:guid}/connect/{platform}")]
    public IActionResult InitiateConnection(Guid brandId, string platform)
    {
        try
        {
            var authUrl = _oauthService.GetAuthorizationUrl(platform, brandId);
            return Ok(new { authUrl });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("callback/{platform}")]
    public async Task<IActionResult> OAuthCallback(string platform, [FromQuery] string code, [FromQuery] string state)
    {
        if (!Guid.TryParse(state, out var brandId))
        {
            return BadRequest("Invalid state parameter");
        }

        try
        {
            var redirectUri = $"{_config["Api:BaseUrl"] ?? "http://localhost:5030"}/api/social/callback/{platform}";
            var tokenResult = await _oauthService.ExchangeCodeForTokenAsync(platform, code, redirectUri);
            
            var encryptedToken = _encryptionService.Encrypt(tokenResult.AccessToken);
            var encryptedRefresh = tokenResult.RefreshToken != null ? _encryptionService.Encrypt(tokenResult.RefreshToken) : null;
            
            await _repo.UpdateBrandSocialTokenAsync(
                brandId, 
                platform, 
                encryptedToken, 
                encryptedRefresh, 
                tokenResult.ExpiresAt, 
                tokenResult.Username, 
                connected: true);

            await _repo.InsertActivityAsync(brandId, "social_connected", $"Successfully connected {platform}");

            _logger.LogInformation("Successfully encrypted and stored OAuth token for {Platform} (Brand: {BrandId})", platform, brandId);
            
            var frontendBaseUrl = _config["Frontend:BaseUrl"] ?? "http://localhost:3000";
            return Redirect($"{frontendBaseUrl}/dashboard/social?connected={platform}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "OAuth Callback failed");
            var frontendBaseUrl = _config["Frontend:BaseUrl"] ?? "http://localhost:3000";
            return Redirect($"{frontendBaseUrl}/dashboard/social?error=auth_failed");
        }
    }

    [HttpDelete("{brandId:guid}/disconnect/{platform}")]
    public async Task<IActionResult> Disconnect(Guid brandId, string platform)
    {
        var ownerId = HttpContext.GetUserId();
        if (ownerId == Guid.Empty) return Unauthorized();

        await _repo.DisconnectBrandPlatformAsync(brandId, ownerId, platform);
        await _repo.InsertActivityAsync(brandId, "social_disconnected", $"Disconnected {platform}");

        return NoContent();
    }
}
