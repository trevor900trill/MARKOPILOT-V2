using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;

namespace Markopilot.Api.Middleware;

/// <summary>
/// Validates Supabase JWT tokens on every API request.
/// Extracts userId and attaches to HttpContext.Items.
/// Per spec Section 5.1.
/// </summary>
public class AuthMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<AuthMiddleware> _logger;
    private readonly string _jwtSecret;

    // Endpoints that skip auth (webhook endpoints use HMAC instead)
    private static readonly string[] PublicPaths =
    [
        "/api/webhooks/lemon-squeezy",
        "/api/webhooks/flutterwave",
        "/hangfire",
        "/health"
    ];

    public AuthMiddleware(RequestDelegate next, ILogger<AuthMiddleware> logger, IConfiguration configuration)
    {
        _next = next;
        _logger = logger;
        _jwtSecret = configuration["Supabase:JwtSecret"]
            ?? throw new InvalidOperationException("Supabase:JwtSecret not configured");
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? "";

        // Skip auth for public endpoints
        if (PublicPaths.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase)))
        {
            await _next(context);
            return;
        }

        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsJsonAsync(new
            {
                error = new { code = "UNAUTHORIZED", message = "Missing or invalid authorization header" }
            });
            return;
        }

        var token = authHeader["Bearer ".Length..];

        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_jwtSecret);

            var validationParams = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromSeconds(30)
            };

            var principal = tokenHandler.ValidateToken(token, validationParams, out _);
            var userId = principal.FindFirst("sub")?.Value
                         ?? principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                         ?? principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                throw new SecurityTokenException("Token does not contain a user ID claim");
            }

            context.Items["UserId"] = Guid.Parse(userId);
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "JWT validation failed");
            context.Response.StatusCode = 401;
            await context.Response.WriteAsJsonAsync(new
            {
                error = new { code = "UNAUTHORIZED", message = "Invalid or expired token" }
            });
        }
    }
}

/// <summary>
/// Extension to easily get the authenticated user ID from HttpContext.
/// </summary>
public static class HttpContextExtensions
{
    public static Guid GetUserId(this HttpContext context)
    {
        if (context.Items.TryGetValue("UserId", out var userId) && userId is Guid id)
            return id;
        throw new UnauthorizedAccessException("User not authenticated");
    }
}
