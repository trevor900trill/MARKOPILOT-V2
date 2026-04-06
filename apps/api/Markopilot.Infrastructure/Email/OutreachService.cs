using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Markopilot.Infrastructure.Supabase;
using Microsoft.Extensions.Configuration;

namespace Markopilot.Infrastructure.Email;

public class OutreachService : IOutreachService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly ITokenEncryptionService _encryptionService;
    private readonly SupabaseRepository _repo;

    public OutreachService(HttpClient httpClient, IConfiguration config, ITokenEncryptionService encryptionService, SupabaseRepository repo)
    {
        _httpClient = httpClient;
        _config = config;
        _encryptionService = encryptionService;
        _repo = repo;
    }

    public async Task<string> RefreshTokenAsync(Brand brand)
    {
        if (string.IsNullOrEmpty(brand.GmailRefreshToken))
        {
            throw new InvalidOperationException("No refresh token available");
        }

        var refreshToken = _encryptionService.Decrypt(brand.GmailRefreshToken);
        var clientId = _config["Google:ClientId"];
        var clientSecret = _config["Google:ClientSecret"];

        var request = new HttpRequestMessage(HttpMethod.Post, "https://oauth2.googleapis.com/token");
        request.Content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["client_id"] = clientId!,
            ["client_secret"] = clientSecret!,
            ["refresh_token"] = refreshToken,
            ["grant_type"] = "refresh_token"
        });

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        var newAccessToken = json.GetProperty("access_token").GetString()!;
        var encryptedAccessToken = _encryptionService.Encrypt(newAccessToken);

        DateTimeOffset? expiresAt = null;
        if (json.TryGetProperty("expires_in", out var exp))
        {
            expiresAt = DateTimeOffset.UtcNow.AddSeconds(exp.GetInt32());
        }

        // Update the Gmail token directly in the database
        await _repo.UpdateBrandSocialTokenAsync(
            brand.Id, "gmail",
            encryptedAccessToken,
            brand.GmailRefreshToken, // keep existing refresh token
            expiresAt,
            brand.GmailEmail,
            true);

        // Update the in-memory brand object for this request
        brand.GmailAccessToken = encryptedAccessToken;
        brand.GmailTokenExpiresAt = expiresAt;

        return newAccessToken;
    }

    public bool ValidateSpamScore(string emailBody, out string reason)
    {
        // Simple spam heuristic check (min 80 words, max 350 words)
        var wordCount = emailBody.Split(new[] { ' ', '\n', '\r', '\t' }, StringSplitOptions.RemoveEmptyEntries).Length;
        
        if (wordCount < 80)
        {
            reason = $"Email body is too short ({wordCount} words). Minimum is 80 words.";
            return false;
        }

        if (wordCount > 350)
        {
            reason = $"Email body is too long ({wordCount} words). Maximum is 350 words.";
            return false;
        }

        reason = string.Empty;
        return true;
    }

    public async Task<bool> DispatchRFC2822EmailAsync(Brand brand, string toEmail, string subject, string bodyText, string bodyHtml)
    {
        if (string.IsNullOrEmpty(brand.GmailAccessToken))
            throw new InvalidOperationException("No access token available");

        string accessToken;
        if (brand.GmailTokenExpiresAt.HasValue && brand.GmailTokenExpiresAt.Value <= DateTimeOffset.UtcNow.AddMinutes(5))
        {
            accessToken = await RefreshTokenAsync(brand);
        }
        else
        {
            accessToken = _encryptionService.Decrypt(brand.GmailAccessToken);
        }

        var message = CreateRFC2822Message(brand, toEmail, subject, bodyText, bodyHtml);

        var request = new HttpRequestMessage(HttpMethod.Post, "https://gmail.googleapis.com/gmail/v1/users/me/messages/send");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        
        var body = new { raw = message };
        request.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new HttpRequestException($"Gmail API error: {response.StatusCode} - {error}");
        }

        return true;
    }

    private string CreateRFC2822Message(Brand brand, string toEmail, string subject, string bodyText, string bodyHtml)
    {
        var boundary = $"--=_NextPart_{Guid.NewGuid():N}";
        var senderName = brand.Name;
        var senderEmail = brand.GmailEmail;

        var builder = new StringBuilder();
        builder.AppendLine($"From: \"{senderName}\" <{senderEmail}>");
        builder.AppendLine($"To: {toEmail}");
        builder.AppendLine($"Subject: {subject}");
        builder.AppendLine("MIME-Version: 1.0");
        builder.AppendLine($"Content-Type: multipart/alternative; boundary=\"{boundary}\"");
        builder.AppendLine();
        
        // Text part
        builder.AppendLine($"--{boundary}");
        builder.AppendLine("Content-Type: text/plain; charset=\"UTF-8\"");
        builder.AppendLine("Content-Transfer-Encoding: base64");
        builder.AppendLine();
        builder.AppendLine(Convert.ToBase64String(Encoding.UTF8.GetBytes(bodyText)));
        
        // HTML part
        builder.AppendLine($"--{boundary}");
        builder.AppendLine("Content-Type: text/html; charset=\"UTF-8\"");
        builder.AppendLine("Content-Transfer-Encoding: base64");
        builder.AppendLine();
        builder.AppendLine(Convert.ToBase64String(Encoding.UTF8.GetBytes(bodyHtml)));
        
        builder.AppendLine($"--{boundary}--");

        var rawMessage = builder.ToString();
        var bytes = Encoding.UTF8.GetBytes(rawMessage);
        
        return Convert.ToBase64String(bytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .Replace("=", "");
    }
}
