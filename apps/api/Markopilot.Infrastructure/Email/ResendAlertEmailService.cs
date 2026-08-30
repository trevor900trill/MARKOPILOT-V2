using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
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

    public async Task<bool> SendPaymentConfirmationEmailAsync(
        string recipientEmail,
        string recipientName,
        string planName,
        decimal amountKes,
        string receiptNumber,
        DateTimeOffset periodEnd)
    {
        var apiKey = _config["Resend:ApiKey"];
        var fromEmail = _config["Resend:FromEmail"] ?? "Markopilot Billing <billing@markopilot.com>";
        var dashboardUrl = _config["Frontend:BaseUrl"] ?? "https://markopilot.com";

        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogWarning("Resend:ApiKey is not configured. Skipping payment confirmation email to {Email}", recipientEmail);
            return false;
        }

        try
        {
            var subject = $"Payment Confirmed! Your Markopilot {planName} Plan is Active (Receipt: {receiptNumber})";
            var formattedDate = periodEnd.ToString("MMMM dd, yyyy");
            var html = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset=""utf-8"">
  <title>Payment Receipt</title>
</head>
<body style=""margin: 0; padding: 40px 16px; background-color: #07070a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f3f4f6;"">
  <table align=""center"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width: 560px; background-color: #111116; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);"">
    <tr>
      <td style=""padding: 32px 32px 24px 32px; background: linear-gradient(180deg, rgba(16, 185, 129, 0.15) 0%, transparent 100%); text-align: center;"">
        <table align=""center"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""48"" height=""48"" style=""width: 48px; height: 48px; margin: 0 auto; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 50%;"">
          <tr>
            <td align=""center"" valign=""middle"" style=""text-align: center; vertical-align: middle; padding: 0; margin: 0; color: #10b981; font-size: 20px; font-weight: bold; line-height: 1; height: 48px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;""><span style=""display: inline-block; vertical-align: middle; line-height: 1;"">&#10003;</span></td>
          </tr>
        </table>
        <h1 style=""margin: 16px 0 4px 0; font-size: 22px; font-weight: 700; color: #ffffff;"">Payment Confirmed!</h1>
        <p style=""margin: 0; font-size: 13px; color: #9ca3af;"">Your subscription has been successfully activated.</p>
      </td>
    </tr>
    <tr>
      <td style=""padding: 0 32px 32px 32px;"">
        <p style=""font-size: 14px; line-height: 1.6; color: #d1d5db;"">
          Hi {recipientName},<br><br>
          Thank you for your payment! Your <strong>Markopilot {planName}</strong> subscription is now active for the next 30 days. Your autonomous marketing and lead extraction engine is running.
        </p>

        <div style=""background-color: #18181f; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 20px; margin: 20px 0;"">
          <table width=""100%"" style=""font-size: 13px; color: #9ca3af;"">
            <tr>
              <td style=""padding: 6px 0;"">Plan:</td>
              <td align=""right"" style=""color: #ffffff; font-weight: 600;"">{planName}</td>
            </tr>
            <tr>
              <td style=""padding: 6px 0;"">Amount Paid:</td>
              <td align=""right"" style=""color: #10b981; font-weight: 700;"">KES {amountKes:N0}</td>
            </tr>
            <tr>
              <td style=""padding: 6px 0;"">M-PESA Receipt:</td>
              <td align=""right"" style=""color: #ffffff; font-family: monospace;"">{receiptNumber}</td>
            </tr>
            <tr>
              <td style=""padding: 6px 0;"">Valid Until:</td>
              <td align=""right"" style=""color: #ffffff;"">{formattedDate}</td>
            </tr>
          </table>
        </div>

        <table align=""center"" border=""0"" cellpadding=""0"" cellspacing=""0"" style=""margin-top: 24px;"">
          <tr>
            <td align=""center"" style=""border-radius: 9999px; background-color: #10b981;"">
              <a href=""{dashboardUrl}/dashboard"" target=""_blank"" style=""display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 600; color: #000000; text-decoration: none; border-radius: 9999px;"">
                Open Dashboard &rarr;
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style=""padding: 20px 32px; background-color: #0c0c10; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;"">
        <p style=""margin: 0; font-size: 11px; color: #6b7280;"">
          Markopilot Ltd • Mirage Tower, Chiromo Rd, Nairobi, Kenya
        </p>
      </td>
    </tr>
  </table>
</body>
</html>";

            var payload = new
            {
                from = fromEmail,
                to = new[] { recipientEmail },
                subject = subject,
                html = html
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Sent payment confirmation email to {Email} (Receipt: {Receipt})", recipientEmail, receiptNumber);
                return true;
            }

            var err = await response.Content.ReadAsStringAsync();
            _logger.LogWarning("Resend payment email error: {Error}", err);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send payment confirmation email to {Email}", recipientEmail);
            return false;
        }
    }

    public async Task<bool> SendTrialExpiringSoonEmailAsync(
        string recipientEmail,
        string recipientName,
        DateTimeOffset trialEndsAt)
    {
        var apiKey = _config["Resend:ApiKey"];
        var fromEmail = _config["Resend:FromEmail"] ?? "Markopilot Billing <billing@markopilot.com>";
        var dashboardUrl = _config["Frontend:BaseUrl"] ?? "https://markopilot.com";

        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogWarning("Resend:ApiKey is not configured. Skipping trial expiry email to {Email}", recipientEmail);
            return false;
        }

        try
        {
            var subject = $"Your Markopilot Trial Ends Tomorrow";
            var formattedDate = trialEndsAt.ToString("MMMM dd, yyyy");
            var html = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset=""utf-8"">
  <title>Trial Ending Soon</title>
</head>
<body style=""margin: 0; padding: 40px 16px; background-color: #07070a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f3f4f6;"">
  <table align=""center"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width: 560px; background-color: #111116; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);"">
    <tr>
      <td style=""padding: 32px 32px 24px 32px; background: linear-gradient(180deg, rgba(245, 158, 11, 0.15) 0%, transparent 100%); text-align: center;"">
        <table align=""center"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""48"" height=""48"" style=""width: 48px; height: 48px; margin: 0 auto; background-color: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 50%;"">
          <tr>
            <td align=""center"" valign=""middle"" style=""text-align: center; vertical-align: middle; padding: 0; margin: 0; color: #f59e0b; font-size: 22px; line-height: 1; height: 48px;""><span style=""display: inline-block; vertical-align: middle; line-height: 1;"">&#9200;</span></td>
          </tr>
        </table>
        <h1 style=""margin: 16px 0 4px 0; font-size: 22px; font-weight: 700; color: #ffffff;"">Your Trial Ends Tomorrow</h1>
        <p style=""margin: 0; font-size: 13px; color: #9ca3af;"">Keep your autonomous marketing engine running</p>
      </td>
    </tr>
    <tr>
      <td style=""padding: 0 32px 32px 32px;"">
        <p style=""font-size: 14px; line-height: 1.6; color: #d1d5db;"">
          Hi {recipientName},<br><br>
          Your 7-day free trial of Markopilot ends on <strong style=""color: #f59e0b;"">{formattedDate}</strong>. To avoid interruption of your autonomous lead extraction and social posting, please activate your subscription via M-PESA.
        </p>

        <div style=""background-color: #18181f; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 20px; margin: 20px 0;"">
          <p style=""margin: 0 0 12px 0; font-size: 13px; color: #9ca3af;"">To continue using Markopilot:</p>
          <ol style=""margin: 0; padding-left: 20px; font-size: 13px; color: #d1d5db; line-height: 1.8;"">
            <li>Go to Account Settings in your dashboard</li>
            <li>Click ""Activate Subscription""</li>
            <li>Complete M-PESA payment (STK Push or Till Number)</li>
          </ol>
        </div>

        <table align=""center"" border=""0"" cellpadding=""0"" cellspacing=""0"" style=""margin-top: 24px;"">
          <tr>
            <td align=""center"" style=""border-radius: 9999px; background-color: #f59e0b;"">
              <a href=""{dashboardUrl}/dashboard/account"" target=""_blank"" style=""display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 600; color: #000000; text-decoration: none; border-radius: 9999px;"">
                Activate Subscription &rarr;
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style=""padding: 20px 32px; background-color: #0c0c10; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;"">
        <p style=""margin: 0; font-size: 11px; color: #6b7280;"">
          Markopilot Ltd • Mirage Tower, Chiromo Rd, Nairobi, Kenya
        </p>
      </td>
    </tr>
  </table>
</body>
</html>";

            var payload = new
            {
                from = fromEmail,
                to = new[] { recipientEmail },
                subject = subject,
                html = html
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Sent trial expiring soon email to {Email}", recipientEmail);
                return true;
            }

            var err = await response.Content.ReadAsStringAsync();
            _logger.LogWarning("Resend trial expiry email error: {Error}", err);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send trial expiring soon email to {Email}", recipientEmail);
            return false;
        }
    }

    public async Task<bool> SendTrialExpiredEmailAsync(
        string recipientEmail,
        string recipientName,
        string planName)
    {
        var apiKey = _config["Resend:ApiKey"];
        var fromEmail = _config["Resend:FromEmail"] ?? "Markopilot Billing <billing@markopilot.com>";
        var dashboardUrl = _config["Frontend:BaseUrl"] ?? "https://markopilot.com";

        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogWarning("Resend:ApiKey is not configured. Skipping trial expired email to {Email}", recipientEmail);
            return false;
        }

        try
        {
            var subject = $"Your Markopilot Trial Has Ended";
            var html = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset=""utf-8"">
  <title>Trial Ended</title>
</head>
<body style=""margin: 0; padding: 40px 16px; background-color: #07070a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f3f4f6;"">
  <table align=""center"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width: 560px; background-color: #111116; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);"">
    <tr>
      <td style=""padding: 32px 32px 24px 32px; background: linear-gradient(180deg, rgba(239, 68, 68, 0.15) 0%, transparent 100%); text-align: center;"">
        <table align=""center"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""48"" height=""48"" style=""width: 48px; height: 48px; margin: 0 auto; background-color: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 50%;"">
          <tr>
            <td align=""center"" valign=""middle"" style=""text-align: center; vertical-align: middle; padding: 0;"">
              <table align=""center"" border=""0"" cellpadding=""0"" cellspacing=""0"" style=""margin: 0 auto;"">
                <tr>
                  <td width=""4"" height=""14"" style=""width: 4px; height: 14px; background-color: #ef4444; border-radius: 2px; font-size: 1px; line-height: 1px;"">&nbsp;</td>
                  <td width=""4"" style=""width: 4px; font-size: 1px; line-height: 1px;"">&nbsp;</td>
                  <td width=""4"" height=""14"" style=""width: 4px; height: 14px; background-color: #ef4444; border-radius: 2px; font-size: 1px; line-height: 1px;"">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <h1 style=""margin: 16px 0 4px 0; font-size: 22px; font-weight: 700; color: #ffffff;"">Your Trial Has Ended</h1>
        <p style=""margin: 0; font-size: 13px; color: #9ca3af;"">Your autonomous engine has been paused</p>
      </td>
    </tr>
    <tr>
      <td style=""padding: 0 32px 32px 32px;"">
        <p style=""font-size: 14px; line-height: 1.6; color: #d1d5db;"">
          Hi {recipientName},<br><br>
          Your 7-day free trial of Markopilot has ended. Your autonomous marketing engine has been paused to prevent overage. To resume service, please activate your {planName} subscription via M-PESA.
        </p>

        <div style=""background-color: #18181f; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 20px; margin: 20px 0;"">
          <p style=""margin: 0 0 12px 0; font-size: 13px; color: #9ca3af;"">To resume your autonomous marketing:</p>
          <ol style=""margin: 0; padding-left: 20px; font-size: 13px; color: #d1d5db; line-height: 1.8;"">
            <li>Go to Account Settings in your dashboard</li>
            <li>Click ""Activate Subscription""</li>
            <li>Complete M-PESA payment (KES {PlanCatalog.GetByName(planName).PriceKes:N0})</li>
          </ol>
        </div>

        <table align=""center"" border=""0"" cellpadding=""0"" cellspacing=""0"" style=""margin-top: 24px;"">
          <tr>
            <td align=""center"" style=""border-radius: 9999px; background-color: #ef4444;"">
              <a href=""{dashboardUrl}/dashboard/account"" target=""_blank"" style=""display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 9999px;"">
                Reactivate Engine &rarr;
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style=""padding: 20px 32px; background-color: #0c0c10; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;"">
        <p style=""margin: 0; font-size: 11px; color: #6b7280;"">
          Markopilot Ltd • Mirage Tower, Chiromo Rd, Nairobi, Kenya
        </p>
      </td>
    </tr>
  </table>
</body>
</html>";

            var payload = new
            {
                from = fromEmail,
                to = new[] { recipientEmail },
                subject = subject,
                html = html
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Sent trial expired email to {Email}", recipientEmail);
                return true;
            }

            var err = await response.Content.ReadAsStringAsync();
            _logger.LogWarning("Resend trial expired email error: {Error}", err);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send trial expired email to {Email}", recipientEmail);
            return false;
        }
    }

    public async Task<bool> SendSubscriptionExpiringSoonEmailAsync(
        string recipientEmail,
        string recipientName,
        string planName,
        DateTimeOffset currentPeriodEnd)
    {
        var apiKey = _config["Resend:ApiKey"];
        var fromEmail = _config["Resend:FromEmail"] ?? "Markopilot Billing <billing@markopilot.com>";
        var dashboardUrl = _config["Frontend:BaseUrl"] ?? "https://markopilot.com";

        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogWarning("Resend:ApiKey is not configured. Skipping subscription expiry email to {Email}", recipientEmail);
            return false;
        }

        try
        {
            var subject = $"Your Markopilot Subscription Renews in 3 Days";
            var formattedDate = currentPeriodEnd.ToString("MMMM dd, yyyy");
            var html = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset=""utf-8"">
  <title>Subscription Renewing</title>
</head>
<body style=""margin: 0; padding: 40px 16px; background-color: #07070a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f3f4f6;"">
  <table align=""center"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width: 560px; background-color: #111116; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);"">
    <tr>
      <td style=""padding: 32px 32px 24px 32px; background: linear-gradient(180deg, rgba(59, 130, 246, 0.15) 0%, transparent 100%); text-align: center;"">
        <table align=""center"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""48"" height=""48"" style=""width: 48px; height: 48px; margin: 0 auto; background-color: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.35); border-radius: 50%;"">
          <tr>
            <td align=""center"" valign=""middle"" style=""text-align: center; vertical-align: middle; padding: 0; margin: 0; color: #3b82f6; font-size: 20px; line-height: 1; height: 48px;""><span style=""display: inline-block; vertical-align: middle; line-height: 1;"">&#128260;</span></td>
          </tr>
        </table>
        <h1 style=""margin: 16px 0 4px 0; font-size: 22px; font-weight: 700; color: #ffffff;"">Subscription Renews in 3 Days</h1>
        <p style=""margin: 0; font-size: 13px; color: #9ca3af;"">Keep your autonomous marketing running uninterrupted</p>
      </td>
    </tr>
    <tr>
      <td style=""padding: 0 32px 32px 32px;"">
        <p style=""font-size: 14px; line-height: 1.6; color: #d1d5db;"">
          Hi {recipientName},<br><br>
          Your {planName} subscription will renew on <strong style=""color: #3b82f6;"">{formattedDate}</strong>. Your autonomous marketing and lead extraction will continue without interruption if payment is successful.
        </p>

        <div style=""background-color: #18181f; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 20px; margin: 20px 0;"">
          <p style=""margin: 0 0 12px 0; font-size: 13px; color: #9ca3af;"">Subscription details:</p>
          <table width=""100%"" style=""font-size: 13px; color: #9ca3af;"">
            <tr>
              <td style=""padding: 6px 0;"">Plan:</td>
              <td align=""right"" style=""color: #ffffff; font-weight: 600;"">{planName}</td>
            </tr>
            <tr>
              <td style=""padding: 6px 0;"">Renewal Date:</td>
              <td align=""right"" style=""color: #ffffff;"">{formattedDate}</td>
            </tr>
          </table>
        </div>

        <table align=""center"" border=""0"" cellpadding=""0"" cellspacing=""0"" style=""margin-top: 24px;"">
          <tr>
            <td align=""center"" style=""border-radius: 9999px; background-color: #3b82f6;"">
              <a href=""{dashboardUrl}/dashboard/account"" target=""_blank"" style=""display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 9999px;"">
                Manage Subscription &rarr;
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style=""padding: 20px 32px; background-color: #0c0c10; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;"">
        <p style=""margin: 0; font-size: 11px; color: #6b7280;"">
          Markopilot Ltd • Mirage Tower, Chiromo Rd, Nairobi, Kenya
        </p>
      </td>
    </tr>
  </table>
</body>
</html>";

            var payload = new
            {
                from = fromEmail,
                to = new[] { recipientEmail },
                subject = subject,
                html = html
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Sent subscription expiring soon email to {Email}", recipientEmail);
                return true;
            }

            var err = await response.Content.ReadAsStringAsync();
            _logger.LogWarning("Resend subscription expiry email error: {Error}", err);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send subscription expiring soon email to {Email}", recipientEmail);
            return false;
        }
    }

    public async Task<bool> SendSubscriptionExpiredEmailAsync(
        string recipientEmail,
        string recipientName,
        string planName)
    {
        var apiKey = _config["Resend:ApiKey"];
        var fromEmail = _config["Resend:FromEmail"] ?? "Markopilot Billing <billing@markopilot.com>";
        var dashboardUrl = _config["Frontend:BaseUrl"] ?? "https://markopilot.com";

        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogWarning("Resend:ApiKey is not configured. Skipping subscription expired email to {Email}", recipientEmail);
            return false;
        }

        try
        {
            var subject = $"Your Markopilot Subscription Has Expired";
            var html = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset=""utf-8"">
  <title>Subscription Expired</title>
</head>
<body style=""margin: 0; padding: 40px 16px; background-color: #07070a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f3f4f6;"">
  <table align=""center"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width: 560px; background-color: #111116; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);"">
    <tr>
      <td style=""padding: 32px 32px 24px 32px; background: linear-gradient(180deg, rgba(239, 68, 68, 0.15) 0%, transparent 100%); text-align: center;"">
        <table align=""center"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""48"" height=""48"" style=""width: 48px; height: 48px; margin: 0 auto; background-color: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 50%;"">
          <tr>
            <td align=""center"" valign=""middle"" style=""text-align: center; vertical-align: middle; padding: 0;"">
              <table align=""center"" border=""0"" cellpadding=""0"" cellspacing=""0"" style=""margin: 0 auto;"">
                <tr>
                  <td width=""4"" height=""14"" style=""width: 4px; height: 14px; background-color: #ef4444; border-radius: 2px; font-size: 1px; line-height: 1px;"">&nbsp;</td>
                  <td width=""4"" style=""width: 4px; font-size: 1px; line-height: 1px;"">&nbsp;</td>
                  <td width=""4"" height=""14"" style=""width: 4px; height: 14px; background-color: #ef4444; border-radius: 2px; font-size: 1px; line-height: 1px;"">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <h1 style=""margin: 16px 0 4px 0; font-size: 22px; font-weight: 700; color: #ffffff;"">Subscription Expired</h1>
        <p style=""margin: 0; font-size: 13px; color: #9ca3af;"">Your autonomous engine has been paused</p>
      </td>
    </tr>
    <tr>
      <td style=""padding: 0 32px 32px 32px;"">
        <p style=""font-size: 14px; line-height: 1.6; color: #d1d5db;"">
          Hi {recipientName},<br><br>
          Your {planName} subscription has expired. Your autonomous marketing engine has been paused. To resume service, please renew your subscription via M-PESA.
        </p>

        <div style=""background-color: #18181f; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 20px; margin: 20px 0;"">
          <p style=""margin: 0 0 12px 0; font-size: 13px; color: #9ca3af;"">To resume your autonomous marketing:</p>
          <ol style=""margin: 0; padding-left: 20px; font-size: 13px; color: #d1d5db; line-height: 1.8;"">
            <li>Go to Account Settings in your dashboard</li>
            <li>Click ""Renew Subscription""</li>
            <li>Complete M-PESA payment (KES {PlanCatalog.GetByName(planName).PriceKes:N0})</li>
          </ol>
        </div>

        <table align=""center"" border=""0"" cellpadding=""0"" cellspacing=""0"" style=""margin-top: 24px;"">
          <tr>
            <td align=""center"" style=""border-radius: 9999px; background-color: #ef4444;"">
              <a href=""{dashboardUrl}/dashboard/account"" target=""_blank"" style=""display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 9999px;"">
                Renew Subscription &rarr;
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style=""padding: 20px 32px; background-color: #0c0c10; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;"">
        <p style=""margin: 0; font-size: 11px; color: #6b7280;"">
          Markopilot Ltd • Mirage Tower, Chiromo Rd, Nairobi, Kenya
        </p>
      </td>
    </tr>
  </table>
</body>
</html>";

            var payload = new
            {
                from = fromEmail,
                to = new[] { recipientEmail },
                subject = subject,
                html = html
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Sent subscription expired email to {Email}", recipientEmail);
                return true;
            }

            var err = await response.Content.ReadAsStringAsync();
            _logger.LogWarning("Resend subscription expired email error: {Error}", err);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send subscription expired email to {Email}", recipientEmail);
            return false;
        }
    }
}
