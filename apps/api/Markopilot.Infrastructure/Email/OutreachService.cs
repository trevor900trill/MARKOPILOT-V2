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
        // Simple spam heuristic check (min 40 words, max 350 words)
        var wordCount = emailBody.Split(new[] { ' ', '\n', '\r', '\t' }, StringSplitOptions.RemoveEmptyEntries).Length;
        
        if (wordCount < 40)
        {
            reason = $"Email body is too short ({wordCount} words). Minimum is 40 words.";
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

        string accessToken = await GetValidAccessTokenAsync(brand);

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

    public async Task<bool> HasRecipientRepliedAsync(Brand brand, string recipientEmail, DateTimeOffset since)
    {
        if (string.IsNullOrEmpty(brand.GmailAccessToken))
            return false;

        string accessToken = await GetValidAccessTokenAsync(brand);

        // Search for any messages from the recipient that arrived AFTER we sent our first email
        var query = $"from:{recipientEmail} after:{since.ToUnixTimeSeconds()}";
        var url = $"https://gmail.googleapis.com/gmail/v1/users/me/messages?q={Uri.EscapeDataString(query)}&maxResults=1";

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await _httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode) return false;

        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        
        // If resultSizeEstimate > 0, someone from that email sent us something
        if (json.TryGetProperty("resultSizeEstimate", out var size) && size.GetInt32() > 0)
        {
            return true;
        }

        return false;
    }

    public async Task<List<string>> GetBouncedEmailsAsync(Brand brand, DateTimeOffset since)
    {
        if (string.IsNullOrEmpty(brand.GmailAccessToken))
            return new List<string>();

        string accessToken = await GetValidAccessTokenAsync(brand);

        var query = $"from:mailer-daemon after:{since.ToUnixTimeSeconds()}";
        var url = $"https://gmail.googleapis.com/gmail/v1/users/me/messages?q={Uri.EscapeDataString(query)}&maxResults=20";

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await _httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode) return new List<string>();

        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        var bouncedEmails = new List<string>();

        if (json.TryGetProperty("messages", out var messages))
        {
            foreach (var message in messages.EnumerateArray())
            {
                var id = message.GetProperty("id").GetString();
                var msgDetail = await GetMessageDetailAsync(accessToken, id!);
                var recipient = ExtractFailedRecipient(msgDetail);
                if (recipient != null) bouncedEmails.Add(recipient);
            }
        }

        return bouncedEmails;
    }

    private async Task<string> GetValidAccessTokenAsync(Brand brand)
    {
        if (brand.GmailTokenExpiresAt.HasValue && brand.GmailTokenExpiresAt.Value <= DateTimeOffset.UtcNow.AddMinutes(5))
        {
            return await RefreshTokenAsync(brand);
        }
        return _encryptionService.Decrypt(brand.GmailAccessToken!);
    }

    private async Task<JsonElement> GetMessageDetailAsync(string accessToken, string messageId)
    {
        var url = $"https://gmail.googleapis.com/gmail/v1/users/me/messages/{messageId}";
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();
        return JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
    }

    private string? ExtractFailedRecipient(JsonElement msg)
    {
        var snippet = msg.GetProperty("snippet").GetString() ?? "";
        // Extract the first email address that isn't the mailer-daemon itself
        var matches = System.Text.RegularExpressions.Regex.Matches(snippet, @"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}");
        foreach (System.Text.RegularExpressions.Match match in matches)
        {
            if (!match.Value.Contains("mailer-daemon", StringComparison.OrdinalIgnoreCase) && 
                !match.Value.Contains("googlemail.com", StringComparison.OrdinalIgnoreCase))
            {
                return match.Value;
            }
        }
        return null;
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
