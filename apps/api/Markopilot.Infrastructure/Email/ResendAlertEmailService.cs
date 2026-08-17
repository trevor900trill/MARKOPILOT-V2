using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Markopilot.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Markopilot.Infrastructure.Email;

public class ResendAlertEmailService : IAlertEmailService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly ILogger<ResendAlertEmailService> _logger;

    public ResendAlertEmailService(HttpClient httpClient, IConfiguration config, ILogger<ResendAlertEmailService> logger)
    {
        _httpClient = httpClient;
        _config = config;
        _logger = logger;
    }

    public async Task<bool> SendErrorAlertAsync(
        string recipientEmail,
        string recipientName,
        string brandName,
        string errorDescription,
        string? actionUrl = null)
    {
        var apiKey = _config["Resend:ApiKey"];
        var fromEmail = _config["Resend:FromEmail"] ?? "Markopilot Alerts <alerts@markopilot.com>";
        var dashboardUrl = _config["Frontend:BaseUrl"] ?? "https://markopilot.com";
        var finalActionUrl = actionUrl ?? $"{dashboardUrl}/dashboard/activity";

        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogWarning("Resend:ApiKey is not configured in appsettings.json. Skipping alert dispatch to {RecipientEmail}.", recipientEmail);
            return false;
        }

        try
        {
            var subject = $"🚨 Well, this is slightly awkward... ({brandName} alert)";
            var htmlBody = GenerateFunAlertHtml(recipientName, brandName, errorDescription, finalActionUrl);

            var payload = new
            {
                from = fromEmail,
                to = new[] { recipientEmail },
                subject = subject,
                html = htmlBody
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                _logger.LogError("Resend API error while dispatching alert: {StatusCode} - {ErrorBody}", response.StatusCode, errorBody);
                return false;
            }

            _logger.LogInformation("Successfully sent fun alert email to {RecipientEmail} via Resend for brand {BrandName}", recipientEmail, brandName);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send Resend alert email to {RecipientEmail}", recipientEmail);
            return false;
        }
    }

    private static string GenerateFunAlertHtml(string userName, string brandName, string errorDescription, string actionUrl)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset=""utf-8"">
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
  <title>Markopilot Alert</title>
</head>
<body style=""margin: 0; padding: 40px 16px; background-color: #07070a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6;"">
  <table align=""center"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width: 560px; background-color: #111116; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);"">
    <!-- Header Banner -->
    <tr>
      <td style=""padding: 32px 32px 20px 32px; background: linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(0,0,0,0) 100%); border-bottom: 1px solid rgba(255, 255, 255, 0.06);"">
        <div style=""display: inline-block; padding: 6px 12px; border-radius: 9999px; background-color: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;"">
          🛸 AI Engine Telemetry
        </div>
        <h1 style=""margin: 16px 0 0 0; font-size: 22px; font-weight: 700; color: #ffffff; line-height: 1.3;"">
          Well, this is slightly awkward...
        </h1>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style=""padding: 28px 32px;"">
        <p style=""margin: 0 0 16px 0; font-size: 15px; color: #d1d5db; line-height: 1.6;"">
          Hey <strong>{userName}</strong>,
        </p>
        <p style=""margin: 0 0 20px 0; font-size: 15px; color: #9ca3af; line-height: 1.6;"">
          Your autonomous growth copilot on <strong style=""color: #ffffff;"">{brandName}</strong> hit a tiny speedbump while doing its thing in the background.
        </p>

        <!-- Error Card -->
        <div style=""background-color: #181820; border-left: 4px solid #ef4444; border-radius: 12px; padding: 16px 20px; margin: 20px 0;"">
          <p style=""margin: 0 0 6px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #ef4444; letter-spacing: 0.5px;"">
            What happened
          </p>
          <p style=""margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; color: #fecaca; line-height: 1.5; word-break: break-word;"">
            {errorDescription}
          </p>
        </div>

        <p style=""margin: 20px 0 28px 0; font-size: 14px; color: #9ca3af; line-height: 1.6;"">
          Don't worry — no servers were harmed, and your scheduled broadcast queue is intact. But giving it a quick 30-second look will keep your marketing machine humming smoothly!
        </p>

        <!-- CTA Button -->
        <table align=""center"" border=""0"" cellpadding=""0"" cellspacing=""0"">
          <tr>
            <td align=""center"" style=""border-radius: 9999px; background: linear-gradient(135deg, #a855f7 0%, #7e22ce 100%);"">
              <a href=""{actionUrl}"" target=""_blank"" style=""display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 9999px; box-shadow: 0 10px 25px rgba(168,85,247,0.4);"">
                Check Activity Cockpit &rarr;
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style=""padding: 20px 32px 28px 32px; background-color: #0c0c10; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;"">
        <p style=""margin: 0; font-size: 12px; color: #6b7280; line-height: 1.5;"">
          Markopilot Autonomous Marketing • Keeping your brand discovered 24/7.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>";
    }
}
