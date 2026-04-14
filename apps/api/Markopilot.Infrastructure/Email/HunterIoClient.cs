using System.Text.Json;
using Markopilot.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Markopilot.Infrastructure.Email;

/// <summary>
/// HTTP client for Hunter.io API v2.
/// Used as Stage 3 fallback in the email enrichment pipeline when SMTP probing fails.
/// Free tier: 25 searches/month. Paid: 500+ searches/month starting at $34/month.
/// </summary>
public class HunterIoClient
{
    private readonly HttpClient _httpClient;
    private readonly string? _apiKey;
    private readonly IGlobalRateLimiter _rateLimiter;
    private readonly ILogger<HunterIoClient> _logger;

    private const string BaseUrl = "https://api.hunter.io/v2";
    private const string RateLimiterKey = "hunter_io";

    public HunterIoClient(
        HttpClient httpClient,
        IConfiguration config,
        IGlobalRateLimiter rateLimiter,
        ILogger<HunterIoClient> logger)
    {
        _httpClient = httpClient;
        _apiKey = config["HunterIo:ApiKey"];
        _rateLimiter = rateLimiter;
        _logger = logger;
    }

    /// <summary>
    /// Whether the Hunter.io integration is configured (API key present).
    /// </summary>
    public bool IsConfigured => !string.IsNullOrWhiteSpace(_apiKey);

    /// <summary>
    /// Search for all known emails at a domain.
    /// Returns a list of found emails and the observed email pattern (e.g. "{first}.{last}").
    /// This is the primary Hunter.io call — cheaper and reveals the domain pattern.
    /// </summary>
    public async Task<HunterDomainSearchResult> DomainSearchAsync(string domain)
    {
        var result = new HunterDomainSearchResult();

        if (!IsConfigured)
        {
            _logger.LogDebug("Hunter.io not configured, skipping domain search for {Domain}", domain);
            return result;
        }

        if (await _rateLimiter.IsCircuitOpenAsync(RateLimiterKey))
        {
            _logger.LogWarning("Hunter.io circuit breaker is open, skipping domain search.");
            return result;
        }

        try
        {
            var url = $"{BaseUrl}/domain-search?domain={Uri.EscapeDataString(domain)}&api_key={_apiKey}";
            var response = await _httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Hunter.io domain search failed for {Domain}: {Status} - {Body}",
                    domain, response.StatusCode, errorBody);
                await _rateLimiter.RecordFailureAsync(RateLimiterKey);
                return result;
            }

            await _rateLimiter.RecordSuccessAsync(RateLimiterKey);

            var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
            var data = json.GetProperty("data");

            // Extract the observed pattern
            if (data.TryGetProperty("pattern", out var patternProp) && patternProp.ValueKind == JsonValueKind.String)
            {
                result.Pattern = patternProp.GetString();
            }

            // Extract found emails
            if (data.TryGetProperty("emails", out var emailsProp) && emailsProp.ValueKind == JsonValueKind.Array)
            {
                foreach (var emailEntry in emailsProp.EnumerateArray())
                {
                    if (emailEntry.TryGetProperty("value", out var valueProp))
                    {
                        var email = valueProp.GetString();
                        if (!string.IsNullOrWhiteSpace(email))
                        {
                            result.Emails.Add(email);
                        }
                    }
                }
            }

            _logger.LogInformation("Hunter.io domain search for {Domain}: found {Count} emails, pattern: {Pattern}",
                domain, result.Emails.Count, result.Pattern ?? "none");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Hunter.io domain search error for {Domain}", domain);
            await _rateLimiter.RecordFailureAsync(RateLimiterKey);
        }

        return result;
    }

    /// <summary>
    /// Find the email for a specific person at a domain.
    /// This is the more targeted (and costly) Hunter.io call — use only when domain search returns nothing.
    /// </summary>
    public async Task<string?> EmailFinderAsync(string domain, string firstName, string lastName)
    {
        if (!IsConfigured)
        {
            _logger.LogDebug("Hunter.io not configured, skipping email finder for {First} {Last} at {Domain}",
                firstName, lastName, domain);
            return null;
        }

        if (await _rateLimiter.IsCircuitOpenAsync(RateLimiterKey))
        {
            _logger.LogWarning("Hunter.io circuit breaker is open, skipping email finder.");
            return null;
        }

        try
        {
            var url = $"{BaseUrl}/email-finder?domain={Uri.EscapeDataString(domain)}" +
                      $"&first_name={Uri.EscapeDataString(firstName)}" +
                      $"&last_name={Uri.EscapeDataString(lastName)}" +
                      $"&api_key={_apiKey}";

            var response = await _httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Hunter.io email finder failed for {First} {Last} at {Domain}: {Status} - {Body}",
                    firstName, lastName, domain, response.StatusCode, errorBody);
                await _rateLimiter.RecordFailureAsync(RateLimiterKey);
                return null;
            }

            await _rateLimiter.RecordSuccessAsync(RateLimiterKey);

            var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
            var data = json.GetProperty("data");

            if (data.TryGetProperty("email", out var emailProp) && emailProp.ValueKind == JsonValueKind.String)
            {
                var email = emailProp.GetString();
                _logger.LogInformation("Hunter.io email finder result for {First} {Last} at {Domain}: {Email}",
                    firstName, lastName, domain, email);
                return email;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Hunter.io email finder error for {First} {Last} at {Domain}",
                firstName, lastName, domain);
            await _rateLimiter.RecordFailureAsync(RateLimiterKey);
        }

        return null;
    }
}

/// <summary>
/// Result from Hunter.io domain search API.
/// Contains found emails and the observed email pattern for the domain.
/// </summary>
public class HunterDomainSearchResult
{
    public List<string> Emails { get; set; } = new();

    /// <summary>
    /// The email pattern Hunter.io has observed for this domain.
    /// e.g. "{first}.{last}" or "{f}{last}".
    /// Null if no pattern detected.
    /// </summary>
    public string? Pattern { get; set; }
}
