using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace Markopilot.Infrastructure.Social;

public class OAuthTokenResult
{
    public string AccessToken { get; set; } = string.Empty;
    public string? RefreshToken { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }
    public string? Username { get; set; }
}

public class OAuthService
{
    private readonly IConfiguration _config;
    private readonly HttpClient _httpClient;
    
    public OAuthService(IConfiguration config, HttpClient httpClient)
    {
        _config = config;
        _httpClient = httpClient;
    }

    public string GetAuthorizationUrl(string platform, Guid brandId)
    {
        var baseUrl = _config["Frontend:BaseUrl"] ?? "http://localhost:3000";
        var rawRedirectUri = $"{_config["Api:BaseUrl"] ?? "http://localhost:5085"}/api/social/callback/{platform}";
        var redirectUri = Uri.EscapeDataString(rawRedirectUri);
        
        switch (platform.ToLower())
        {
            case "linkedin":
                return $"https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id={_config["Social:LinkedIn:ClientId"]}&redirect_uri={redirectUri}&state={brandId}&scope=w_member_social%20profile%20openid%20email";
            case "x":
            case "twitter":
                return $"https://twitter.com/i/oauth2/authorize?response_type=code&client_id={_config["Social:X:ClientId"]}&redirect_uri={redirectUri}&scope=tweet.read%20tweet.write%20users.read%20offline.access&state={brandId}&code_challenge=challenge&code_challenge_method=plain";
            case "instagram":
                return $"https://api.instagram.com/oauth/authorize?client_id={_config["Social:Instagram:ClientId"]}&redirect_uri={redirectUri}&scope=instagram_basic,instagram_content_publish&response_type=code&state={brandId}";
            case "tiktok":
                return $"https://www.tiktok.com/v2/auth/authorize?client_key={_config["Social:TikTok:ClientKey"]}&response_type=code&redirect_uri={redirectUri}&scope=user.info.basic,video.publish&state={brandId}";
            case "gmail":
                // offline access forces refresh token generation
                return $"https://accounts.google.com/o/oauth2/v2/auth?client_id={_config["Google:ClientId"]}&redirect_uri={redirectUri}&response_type=code&scope=https://www.googleapis.com/auth/gmail.send%20https://www.googleapis.com/auth/gmail.readonly&state={brandId}&access_type=offline&prompt=consent";
            default:
                throw new ArgumentException($"Unsupported social platform: {platform}");
        }
    }

    public async Task<OAuthTokenResult> ExchangeCodeForTokenAsync(string platform, string code, string redirectUri)
    {
        return platform.ToLower() switch
        {
            "x" or "twitter" => await ExchangeTwitterTokenAsync(code, redirectUri),
            "linkedin" => await ExchangeLinkedInTokenAsync(code, redirectUri),
            "instagram" => await ExchangeInstagramTokenAsync(code, redirectUri),
            "tiktok" => await ExchangeTikTokTokenAsync(code, redirectUri),
            "gmail" => await ExchangeGmailTokenAsync(code, redirectUri),
            _ => throw new ArgumentException($"Unsupported platform: {platform}")
        };
    }

    private async Task<OAuthTokenResult> ExchangeGmailTokenAsync(string code, string redirectUri)
    {
        var clientId = _config["Google:ClientId"];
        var clientSecret = _config["Google:ClientSecret"];
        
        var request = new HttpRequestMessage(HttpMethod.Post, "https://oauth2.googleapis.com/token");
        request.Content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["client_id"] = clientId!,
            ["client_secret"] = clientSecret!,
            ["code"] = code,
            ["grant_type"] = "authorization_code",
            ["redirect_uri"] = redirectUri
        });

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();
        
        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;

        return new OAuthTokenResult
        {
            AccessToken = json.GetProperty("access_token").GetString()!,
            RefreshToken = json.TryGetProperty("refresh_token", out var rt) ? rt.GetString() : null,
            ExpiresAt = json.TryGetProperty("expires_in", out var exp) ? DateTimeOffset.UtcNow.AddSeconds(exp.GetInt32()) : null
        };
    }

    private async Task<OAuthTokenResult> ExchangeTwitterTokenAsync(string code, string redirectUri)
    {
        var clientId = _config["Social:X:ClientId"];
        var clientSecret = _config["Social:X:ClientSecret"];
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.twitter.com/2/oauth2/token");
        
        // Twitter/X OAuth 2.0 requires Basic Auth header for confidential clients
        var authHeader = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{clientId}:{clientSecret}"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", authHeader);

        var formData = new Dictionary<string, string>
        {
            ["grant_type"] = "authorization_code",
            ["code"] = code,
            ["redirect_uri"] = redirectUri,
            ["code_verifier"] = "challenge"
        };
        request.Content = new FormUrlEncodedContent(formData);

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(content).RootElement;

        return new OAuthTokenResult
        {
            AccessToken = json.GetProperty("access_token").GetString()!,
            RefreshToken = json.TryGetProperty("refresh_token", out var rt) ? rt.GetString() : null,
            ExpiresAt = json.TryGetProperty("expires_in", out var exp) ? DateTimeOffset.UtcNow.AddSeconds(exp.GetInt32()) : null
        };
    }

    private async Task<OAuthTokenResult> ExchangeLinkedInTokenAsync(string code, string redirectUri)
    {
        var clientId = _config["Social:LinkedIn:ClientId"];
        var clientSecret = _config["Social:LinkedIn:ClientSecret"];
        
        var request = new HttpRequestMessage(HttpMethod.Post, "https://www.linkedin.com/oauth/v2/accessToken");
        var formData = new Dictionary<string, string>
        {
            ["grant_type"] = "authorization_code",
            ["code"] = code,
            ["redirect_uri"] = redirectUri,
            ["client_id"] = clientId!,
            ["client_secret"] = clientSecret!
        };
        request.Content = new FormUrlEncodedContent(formData);

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(content).RootElement;

        return new OAuthTokenResult
        {
            AccessToken = json.GetProperty("access_token").GetString()!,
            ExpiresAt = json.TryGetProperty("expires_in", out var exp) ? DateTimeOffset.UtcNow.AddSeconds(exp.GetInt32()) : null
        };
    }

    private async Task<OAuthTokenResult> ExchangeInstagramTokenAsync(string code, string redirectUri)
    {
        var clientId = _config["Social:Instagram:ClientId"];
        var clientSecret = _config["Social:Instagram:ClientSecret"];

        // 1. Get short-lived token
        var req1 = new HttpRequestMessage(HttpMethod.Post, "https://api.instagram.com/oauth/access_token");
        req1.Content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["client_id"] = clientId!,
            ["client_secret"] = clientSecret!,
            ["grant_type"] = "authorization_code",
            ["redirect_uri"] = redirectUri,
            ["code"] = code
        });
        var res1 = await _httpClient.SendAsync(req1);
        res1.EnsureSuccessStatusCode();
        var json1 = JsonDocument.Parse(await res1.Content.ReadAsStringAsync()).RootElement;
        var shortToken = json1.GetProperty("access_token").GetString()!;
        var userId = json1.GetProperty("user_id").GetInt64().ToString();

        // 2. Exchange for long-lived token
        var res2 = await _httpClient.GetAsync($"https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret={clientSecret}&access_token={shortToken}");
        res2.EnsureSuccessStatusCode();
        var json2 = JsonDocument.Parse(await res2.Content.ReadAsStringAsync()).RootElement;

        return new OAuthTokenResult
        {
            AccessToken = json2.GetProperty("access_token").GetString()!,
            Username = userId,
            ExpiresAt = DateTimeOffset.UtcNow.AddSeconds(json2.GetProperty("expires_in").GetInt32())
        };
    }

    private async Task<OAuthTokenResult> ExchangeTikTokTokenAsync(string code, string redirectUri)
    {
        var clientKey = _config["Social:TikTok:ClientKey"];
        var clientSecret = _config["Social:TikTok:ClientSecret"];
        
        var request = new HttpRequestMessage(HttpMethod.Post, "https://open.tiktokapis.com/v2/oauth/token/");
        request.Content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["client_key"] = clientKey!,
            ["client_secret"] = clientSecret!,
            ["grant_type"] = "authorization_code",
            ["code"] = code,
            ["redirect_uri"] = redirectUri
        });

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();
        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;

        return new OAuthTokenResult
        {
            AccessToken = json.GetProperty("access_token").GetString()!,
            RefreshToken = json.TryGetProperty("refresh_token", out var rt) ? rt.GetString() : null,
            ExpiresAt = json.TryGetProperty("expires_in", out var exp) ? DateTimeOffset.UtcNow.AddSeconds(exp.GetInt32()) : null
        };
    }
}
