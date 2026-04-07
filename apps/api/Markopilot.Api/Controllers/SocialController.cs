using Markopilot.Api.Middleware;
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
    private readonly IQuotaService _quotaService;
    private readonly IConfiguration _config;
    private readonly ILogger<SocialController> _logger;
    private readonly ISocialRepository _socialRepo;
    private readonly IBrandRepository _brandRepo;

    public SocialController(
        OAuthService oauthService,
        ITokenEncryptionService encryptionService,
        IQuotaService quotaService,
        IConfiguration config,
        ILogger<SocialController> logger,
        ISocialRepository socialRepo,
        IBrandRepository brandRepo)
    {
        _oauthService = oauthService;
        _encryptionService = encryptionService;
        _quotaService = quotaService;
        _config = config;
        _logger = logger;
        _socialRepo = socialRepo;
        _brandRepo = brandRepo;
    }

    [HttpGet("{brandId:guid}/posts")]
    public async Task<IActionResult> GetPosts(Guid brandId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var ownerId = HttpContext.GetUserId();
        var result = await _socialRepo.GetPostsByBrandAsync(brandId, ownerId, page, pageSize);
        return Ok(new { data = result, total = result.Count, page, pageSize, totalPages = 1 });
    }

    [HttpPost("{brandId:guid}/posts")]
    public async Task<IActionResult> CreatePost(Guid brandId, [FromBody] Markopilot.Core.Models.SocialPost post)
    {
        var ownerId = HttpContext.GetUserId();
        if (ownerId == Guid.Empty) return Unauthorized();

        if (!await _quotaService.CanGeneratePostAsync(ownerId))
        {
            return StatusCode(403, new { error = new { code = "QUOTA_EXCEEDED", message = "Post limit reached for this month." } });
        }

        post.Id = Guid.NewGuid();
        post.BrandId = brandId;
        post.Status = "queued";
        post.GeneratedAt = DateTimeOffset.UtcNow;
        
        await _socialRepo.CreatePostAsync(post);
        return Ok(post);
    }

    [HttpDelete("{brandId:guid}/posts/{postId:guid}")]
    public async Task<IActionResult> CancelPost(Guid brandId, Guid postId)
    {
        var ownerId = HttpContext.GetUserId();
        await _socialRepo.CancelPostAsync(postId, ownerId);
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
            return StatusCode(400, new { error = new { code = "AUTH_INIT_FAILED", message = ex.Message } });
        }
    }

    [HttpGet("callback/{platform}")]
    public async Task<IActionResult> OAuthCallback(string platform, [FromQuery] string code, [FromQuery] string state)
    {
        if (!Guid.TryParse(state, out var brandId))
        {
            return StatusCode(400, new { error = new { code = "INVALID_STATE", message = "Invalid state parameter" } });
        }

        try
        {
            var apiBaseUrl = _config["Api:BaseUrl"] ?? "http://localhost:5085";
            var redirectUri = $"{apiBaseUrl}/api/social/callback/{platform}";
            
            _logger.LogInformation("Exchanging OAuth code for {Platform} (Brand: {BrandId}). Redirect URI: {RedirectUri}", platform, brandId, redirectUri);
            
            var tokenResult = await _oauthService.ExchangeCodeForTokenAsync(platform, code, redirectUri);
            
            var encryptedToken = _encryptionService.Encrypt(tokenResult.AccessToken);
            var encryptedRefresh = tokenResult.RefreshToken != null ? _encryptionService.Encrypt(tokenResult.RefreshToken) : null;
            
            await _socialRepo.UpdateBrandSocialTokenAsync(
                brandId, 
                platform, 
                encryptedToken, 
                encryptedRefresh, 
                tokenResult.ExpiresAt, 
                tokenResult.Username, 
                connected: true);

            await _brandRepo.InsertActivityAsync(brandId, "social_connected", $"Successfully connected {platform}");

            _logger.LogInformation("Successfully connected {Platform} for brand {BrandId}", platform, brandId);
            
            var frontendBaseUrl = _config["Frontend:BaseUrl"] ?? "http://localhost:3000";
            return Redirect($"{frontendBaseUrl}/dashboard/social?connected={platform}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "OAuth Callback failed for {Platform} (Brand: {BrandId})", platform, brandId);
            var frontendBaseUrl = _config["Frontend:BaseUrl"] ?? "http://localhost:3000";
            return Redirect($"{frontendBaseUrl}/dashboard/social?error=auth_failed");
        }
    }

    [HttpDelete("{brandId:guid}/disconnect/{platform}")]
    public async Task<IActionResult> Disconnect(Guid brandId, string platform)
    {
        var ownerId = HttpContext.GetUserId();
        if (ownerId == Guid.Empty) return Unauthorized();

        await _socialRepo.DisconnectBrandPlatformAsync(brandId, ownerId, platform);
        await _brandRepo.InsertActivityAsync(brandId, "social_disconnected", $"Disconnected {platform}");

        return NoContent();
    }
}
