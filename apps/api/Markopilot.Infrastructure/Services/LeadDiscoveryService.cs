using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using System.Net.Sockets;
using System.IO;
using DnsClient;
using DnsClient.Protocol;
using HtmlAgilityPack;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Markopilot.Infrastructure.Search;
using Microsoft.Extensions.Logging;

namespace Markopilot.Infrastructure.Services;

public class LeadDiscoveryService : ILeadDiscoveryService
{
    private readonly IEnumerable<ISearchClient> _searchClients;
    private readonly IAiRoutingService _aiService;
    private readonly HttpClient _httpClient;
    private readonly JinaReaderClient _jinaClient;
    private readonly ILogger<LeadDiscoveryService> _logger;

    public LeadDiscoveryService(
        IEnumerable<ISearchClient> searchClients,
        IAiRoutingService aiService,
        HttpClient httpClient,
        JinaReaderClient jinaClient,
        ILogger<LeadDiscoveryService> logger)
    {
        _searchClients = searchClients;
        _aiService = aiService;
        _httpClient = httpClient;
        _jinaClient = jinaClient;
        _logger = logger;
        _httpClient.Timeout = TimeSpan.FromSeconds(10);
    }

    public async Task<List<SearchResult>> SearchAsync(string query, bool useExa = false)
    {
        var provider = useExa ? "exa" : "serper";
        var client = _searchClients.FirstOrDefault(c => string.Equals(c.Provider, provider, StringComparison.OrdinalIgnoreCase));
        
        if (client == null)
        {
            _logger.LogWarning("Search provider {Provider} not found. Fallback to first available.", provider);
            client = _searchClients.FirstOrDefault();
        }

        if (client == null)
        {
            _logger.LogError("No search providers configured.");
            return new List<SearchResult>();
        }

        return await client.SearchAsync(query, 10);
    }

    public async Task<string> ScrapePageAsync(string url)
    {
        if (string.IsNullOrWhiteSpace(url)) return string.Empty;

        // Try Jina Reader first (optimized for LLMs and harder to block)
        var jinaContent = await _jinaClient.FetchContentAsync(url);
        if (!string.IsNullOrWhiteSpace(jinaContent))
        {
            return jinaContent.Length > 10000 ? jinaContent.Substring(0, 10000) : jinaContent;
        }

        // Fallback to basic HttpClient scraping if Jina fails
        try
        {
            var request = CreateBrowserLikeRequest(url);
            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to scrape {Url}. Status: {StatusCode}", url, response.StatusCode);
                return string.Empty;
            }

            var htmlContent = await response.Content.ReadAsStringAsync();
            var htmlDoc = new HtmlDocument();
            htmlDoc.LoadHtml(htmlContent);

            // Remove scripts, styles, and hidden elements to clean up text
            var nodesToRemove = htmlDoc.DocumentNode.SelectNodes("//script|//style|//noscript|//svg");
            if (nodesToRemove != null)
            {
                foreach (var element in nodesToRemove)
                {
                    element.Remove();
                }
            }

            string text = HtmlEntity.DeEntitize(htmlDoc.DocumentNode.InnerText);
            // Replace multiple whitespaces with a single space
            text = Regex.Replace(text, @"\s+", " ").Trim();

            // Truncate if too large to save tokens
            if (text.Length > 10000)
            {
                text = text.Substring(0, 10000);
            }

            return text;
        }
        catch (TaskCanceledException)
        {
            _logger.LogWarning("Timeout scraping {Url}", url);
            return string.Empty;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error scraping {Url}", url);
            return string.Empty;
        }
    }

    public async Task<ExtractedEntity?> ExtractEntityAsync(string scrapedText)
    {
        if (string.IsNullOrWhiteSpace(scrapedText)) return null;

        var systemPrompt = @"Extract contact information from the following search result snippet or web page content. Return only structured data. If a field is not present, return null.

Return ONLY this JSON structure, no preamble:
{
  ""name"": ""string | null"",
  ""jobTitle"": ""string | null"",
  ""company"": ""string | null"",
  ""email"": ""string | null"",
  ""linkedinUrl"": ""string | null"",
  ""twitterHandle"": ""string | null"",
  ""location"": ""string | null"",
  ""confidence"": ""low | medium | high""
}

Set confidence to ""high"" if name + job title + company all found. ""medium"" if at least 2 of those 3 found. ""low"" otherwise.";

        var request = new AiCompletionRequest
        {
            Task = AiTask.EntityExtraction,
            SystemPrompt = systemPrompt,
            UserPrompt = $"WEB PAGE/SNIPPET CONTENT:\n{scrapedText}",
            Temperature = 0.1,
            MaxTokens = 512
        };

        string originalContent = string.Empty;
        try
        {
            var response = await _aiService.CompleteAsync(request);
            originalContent = response.Content;
            var content = originalContent;
            
            // Robust bracket counting to extract the first complete JSON object
            int start = content.IndexOf('{');
            if (start != -1)
            {
                int end = -1;
                int depth = 0;
                for (int i = start; i < content.Length; i++)
                {
                    if (content[i] == '{') depth++;
                    else if (content[i] == '}') depth--;

                    if (depth == 0)
                    {
                        end = i;
                        break;
                    }
                }

                if (end != -1 && end > start)
                {
                    content = content.Substring(start, end - start + 1);
                }
            }

            var entity = System.Text.Json.JsonSerializer.Deserialize<ExtractedEntity>(
                content,
                new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            
            return entity;
        }
        catch (System.Text.Json.JsonException jsonEx)
        {
            _logger.LogError(jsonEx, "Failed to extract entity from text. Raw LLM content:\n{Content}", originalContent);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to complete AI request for entity extraction.");
            return null;
        }
    }

    public async Task<LeadScoreResult> ScoreLeadAsync(Brand brand, ExtractedEntity entity, string sourceUrl)
    {
        var systemPrompt = @"Score this potential lead on a scale of 0-100 based on fit with the target customer profile.

SCORING GUIDE:
80-100: Near-perfect match. Job title, company type, and geography all align.
60-79: Good match. Most criteria align with minor gaps.
40-59: Partial match. Some criteria align but significant gaps exist.
0-39: Poor match. Do not score below 30 unless clearly irrelevant.

Return ONLY this JSON, no preamble:
{
  ""score"": <integer 0-100>,
  ""summary"": ""<exactly 2 sentences explaining the fit>""
}";

        var brandText = $"Brand: {brand.Name}\nIndustry: {brand.Industry}\nTarget audience: {brand.TargetAudienceDescription}\nTarget job titles: {string.Join(", ", brand.TargetJobTitles)}\nPain points: {string.Join(", ", brand.TargetPainPoints)}";
        var leadText = $"Name: {entity.Name}\nJob Title: {entity.JobTitle}\nCompany: {entity.Company}\nLocation: {entity.Location}\nFound at: {sourceUrl}";

        var request = new AiCompletionRequest
        {
            Task = AiTask.LeadScoring,
            SystemPrompt = systemPrompt,
            UserPrompt = $"BRAND TARGET PROFILE:\n{brandText}\n\nLEAD DATA:\n{leadText}",
            Temperature = 0.1,
            MaxTokens = 256
        };

        string originalContent = string.Empty;
        try
        {
            var response = await _aiService.CompleteAsync(request);
            originalContent = response.Content;
            var content = originalContent;
            
            // Robust bracket counting to extract the first complete JSON object
            int start = content.IndexOf('{');
            if (start != -1)
            {
                int end = -1;
                int depth = 0;
                for (int i = start; i < content.Length; i++)
                {
                    if (content[i] == '{') depth++;
                    else if (content[i] == '}') depth--;

                    if (depth == 0)
                    {
                        end = i;
                        break;
                    }
                }

                if (end != -1 && end > start)
                {
                    content = content.Substring(start, end - start + 1);
                }
            }

            var scoreResult = System.Text.Json.JsonSerializer.Deserialize<LeadScoreResult>(
                content,
                new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                
            return scoreResult ?? new LeadScoreResult { Score = 0, Summary = "Failed to parse scoring" };
        }
        catch (System.Text.Json.JsonException jsonEx)
        {
            _logger.LogError(jsonEx, "Failed to score lead {Name}. Raw LLM content:\n{Content}", entity.Name, originalContent);
            return new LeadScoreResult { Score = 0, Summary = "Failed to parse scoring" };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to score lead {Name}", entity.Name);
            return new LeadScoreResult { Score = 0, Summary = "Error during scoring calculation" };
        }
    }

    public async Task<EmailVerificationResult> ValidateEmailAsync(string email)
    {
        var result = new EmailVerificationResult { Email = email, Source = "smtp" };
        if (string.IsNullOrWhiteSpace(email) || !Regex.IsMatch(email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
        {
            result.Status = EmailVerificationStatus.Invalid;
            result.Confidence = 0.0;
            return result;
        }

        try
        {
            var domain = email.Split('@').Last();
            var lookup = new LookupClient();
            var lookupResult = await lookup.QueryAsync(domain, QueryType.MX);
            var mxRecords = lookupResult.Answers.MxRecords().OrderBy(mx => mx.Preference).ToList();

            if (!mxRecords.Any())
            {
                result.Status = EmailVerificationStatus.Invalid;
                result.Confidence = 0.0;
                return result;
            }

            // Identify provider from first MX record
            var topMx = mxRecords[0].Exchange.Value;
            result.Provider = DetectProvider(topMx);

            // Connect and check
            var verification = await InternalSmtpCheckAsync(email, mxRecords, domain);
            result.Status = verification.Status;
            result.Confidence = verification.Confidence;
            result.IsCatchAll = verification.IsCatchAll;
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed SMTP validation for {Email}", email);
            result.Status = EmailVerificationStatus.Unknown;
            return result;
        }
    }

    public async Task<string?> SearchForEmailAsync(string name, string company, string domain)
    {
        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(domain)) return null;

        var emailRegex = new Regex(@"[a-zA-Z0-9._%+-]+@" + Regex.Escape(domain), RegexOptions.IgnoreCase);

        // Google dork queries — targeting publicly exposed emails
        var queries = new[]
        {
            $"\"{name}\" \"@{domain}\" email",
            $"\"{name}\" \"{company}\" email contact",
            $"site:{domain} \"{name}\" email",
        };

        foreach (var query in queries)
        {
            try
            {
                var results = await SearchAsync(query);
                if (results.Count == 0) continue;

                // Scrape top 3 results max
                foreach (var result in results.Take(3))
                {
                    try
                    {
                        var content = await ScrapePageAsync(result.Url);
                        if (string.IsNullOrWhiteSpace(content)) continue;

                        var matches = emailRegex.Matches(content);
                        foreach (Match match in matches)
                        {
                            var foundEmail = match.Value.ToLowerInvariant();
                            // Filter out generic addresses
                            if (!foundEmail.StartsWith("info@") && !foundEmail.StartsWith("support@") &&
                                !foundEmail.StartsWith("contact@") && !foundEmail.StartsWith("hello@") &&
                                !foundEmail.StartsWith("admin@") && !foundEmail.StartsWith("sales@") &&
                                !foundEmail.StartsWith("noreply@") && !foundEmail.StartsWith("no-reply@"))
                            {
                                _logger.LogInformation("Web scrape found email {Email} from {Url}", foundEmail, result.Url);
                                return foundEmail;
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogDebug(ex, "Failed to scrape {Url} for email search", result.Url);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Search query failed: {Query}", query);
            }
        }

        return null;
    }

    public async Task<EmailVerificationResult?> DiscoverEmailAsync(string name, string company, string domain)
    {
        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(domain)) return null;

        var parts = name.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var first = parts.Length > 0 ? parts[0].ToLowerInvariant() : "";
        var last = parts.Length > 1 ? parts[parts.Length - 1].ToLowerInvariant() : "";
        
        var permutations = new List<string>
        {
            $"{first}@{domain}",
            $"{first}.{last}@{domain}",
            $"{first}{last}@{domain}",
            $"{first[0]}{last}@{domain}",
            $"{first}_{last}@{domain}",
            $"{last}@{domain}",
            $"{first[0]}.{last}@{domain}",
            $"{first}.{last[0]}@{domain}",
            $"{first}{last[0]}@{domain}",
            $"{last}.{first}@{domain}",
            $"{first[0]}{last[0]}@{domain}"
        }.Distinct().Where(e => !e.StartsWith("@") && !e.Contains("..")).ToList();

        try
        {
            var lookup = new LookupClient();
            var lookupResult = await lookup.QueryAsync(domain, QueryType.MX);
            var mxRecords = lookupResult.Answers.MxRecords().OrderBy(mx => mx.Preference).ToList();

            if (!mxRecords.Any()) return null;

            var provider = DetectProvider(mxRecords[0].Exchange.Value);

            // ── CATCH-ALL MULTI-PROBE ───────────────────────
            // Test 2 random emails to ensure consistency
            var probes = new[] { 
                $"verifier_test_{Guid.NewGuid():N}.{Guid.NewGuid():N}"[..12] + $"@{domain}",
                $"probe_{DateTime.UtcNow.Ticks}@{domain}"
            };

            var verification = await InternalSmtpCheckAsync(permutations, mxRecords, domain, probes);
            
            if (verification != null)
            {
                verification.Provider = provider;
                verification.Source = "smtp";
                return verification;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "DiscoverEmailAsync failed for {Domain}", domain);
        }

        return null;
    }

    private string DetectProvider(string mxDomain)
    {
        mxDomain = mxDomain.ToLowerInvariant();
        if (mxDomain.Contains("google.com") || mxDomain.Contains("aspmx.l.google.com")) return "google";
        if (mxDomain.Contains("outlook.com") || mxDomain.Contains("outlook.com")) return "outlook";
        if (mxDomain.Contains("mimecast.com")) return "mimecast";
        if (mxDomain.Contains("pphosted.com")) return "proofpoint";
        if (mxDomain.Contains("secureserver.net")) return "godaddy";
        return "custom";
    }

    private async Task<EmailVerificationResult> InternalSmtpCheckAsync(string targetEmail, List<MxRecord> mxRecords, string domain, string[]? probes = null)
    {
        var result = await InternalSmtpCheckAsync(new List<string> { targetEmail }, mxRecords, domain, probes);
        return result ?? new EmailVerificationResult { Email = targetEmail, Status = EmailVerificationStatus.Unknown };
    }

    private async Task<EmailVerificationResult?> InternalSmtpCheckAsync(List<string> candidateEmails, List<MxRecord> mxRecords, string domain, string[]? probes = null)
    {
        foreach (var mx in mxRecords)
        {
            var mxDomain = mx.Exchange.Value;
            if (mxDomain.EndsWith(".")) mxDomain = mxDomain[..^1];

            try
            {
                using var client = new TcpClient();
                var connectTask = client.ConnectAsync(mxDomain, 25);
                if (await Task.WhenAny(connectTask, Task.Delay(5000)) != connectTask) continue;
                
                using var stream = client.GetStream();
                using var reader = new StreamReader(stream);
                using var writer = new StreamWriter(stream) { AutoFlush = true };

                var greeting = await reader.ReadLineAsync();
                if (greeting == null || !greeting.StartsWith("220")) continue;

                await writer.WriteLineAsync("HELO mail.markopilot.com");
                await reader.ReadLineAsync();

                await writer.WriteLineAsync("MAIL FROM:<ping@markopilot.com>");
                await reader.ReadLineAsync();

                // ── CATCH-ALL BURN TEST ───────────────────────
                bool isCatchAll = false;
                if (probes != null)
                {
                    int acceptedProbes = 0;
                    foreach (var probe in probes)
                    {
                        await writer.WriteLineAsync($"RCPT TO:<{probe}>");
                        var probeResponse = await reader.ReadLineAsync();
                        if (probeResponse != null && probeResponse.StartsWith("250")) acceptedProbes++;
                    }
                    isCatchAll = acceptedProbes == probes.Length;
                }

                if (isCatchAll)
                {
                    _logger.LogInformation("Domain {Domain} identified as Catch-All", domain);
                    await writer.WriteLineAsync("QUIT");
                    return new EmailVerificationResult 
                    { 
                        Email = candidateEmails.First(), 
                        Status = EmailVerificationStatus.Risky, 
                        Confidence = 0.4, 
                        IsCatchAll = true 
                    };
                }

                foreach (var email in candidateEmails)
                {
                    // Add jitter between attempts to look human
                    await Task.Delay(Random.Shared.Next(300, 800));

                    await writer.WriteLineAsync($"RCPT TO:<{email}>");
                    var rcptResponse = await reader.ReadLineAsync();
                    
                    if (rcptResponse != null && rcptResponse.StartsWith("250"))
                    {
                        await writer.WriteLineAsync("QUIT");
                        return new EmailVerificationResult 
                        { 
                            Email = email, 
                            Status = EmailVerificationStatus.Valid, 
                            Confidence = 0.9, 
                            IsCatchAll = false 
                        };
                    }
                }

                await writer.WriteLineAsync("QUIT");
                return new EmailVerificationResult { Email = candidateEmails.First(), Status = EmailVerificationStatus.Invalid, Confidence = 0.0 };
            }
            catch { continue; }
        }
        return null;
    }

    public async Task<string?> DiscoverDomainAsync(string companyName)
    {
        if (string.IsNullOrWhiteSpace(companyName)) return null;

        try
        {
            // Use Serper as the default provider for domain discovery as it has the best "official website" detection
            var client = _searchClients.FirstOrDefault(c => string.Equals(c.Provider, "serper", StringComparison.OrdinalIgnoreCase)) ?? _searchClients.FirstOrDefault();
            if (client == null) return null;

            var results = await client.SearchAsync($"{companyName} official website", 1);
            if (results.Count > 0)
            {
                var uri = new Uri(results[0].Url);
                var domain = uri.Host;
                if (domain.StartsWith("www.")) domain = domain.Substring(4);
                return domain;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Domain discovery failed for {Company}: {Message}", companyName, ex.Message);
        }

        return null;
    }

    private HttpRequestMessage CreateBrowserLikeRequest(string url)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        
        // Use a modern, varied chrome User-Agent
        request.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36");
        
        // Standard browser headers that many bot-detectors look for
        request.Headers.Add("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8");
        request.Headers.Add("Accept-Language", "en-US,en;q=0.9");
        request.Headers.Add("Range", "bytes=0-100000"); // Request first 100KB to save time/bandwidth
        
        // Modern browser navigation headers
        request.Headers.Add("Upgrade-Insecure-Requests", "1");
        request.Headers.TryAddWithoutValidation("Sec-Fetch-Dest", "document");
        request.Headers.TryAddWithoutValidation("Sec-Fetch-Mode", "navigate");
        request.Headers.TryAddWithoutValidation("Sec-Fetch-Site", "none");
        request.Headers.TryAddWithoutValidation("Sec-Fetch-User", "?1");
        
        return request;
    }
}
