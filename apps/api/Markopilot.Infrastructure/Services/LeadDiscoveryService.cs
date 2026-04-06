using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using DnsClient;
using HtmlAgilityPack;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Logging;

namespace Markopilot.Infrastructure.Services;

public class LeadDiscoveryService : ILeadDiscoveryService
{
    private readonly IEnumerable<ISearchClient> _searchClients;
    private readonly IAiRoutingService _aiService;
    private readonly HttpClient _httpClient;
    private readonly ILogger<LeadDiscoveryService> _logger;

    public LeadDiscoveryService(
        IEnumerable<ISearchClient> searchClients,
        IAiRoutingService aiService,
        HttpClient httpClient,
        ILogger<LeadDiscoveryService> logger)
    {
        _searchClients = searchClients;
        _aiService = aiService;
        _httpClient = httpClient;
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
        try
        {
            var response = await _httpClient.GetAsync(url);
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

        var systemPrompt = @"Extract contact information from the following web page content. Return only structured data. If a field is not present, return null.

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
            UserPrompt = $"WEB PAGE CONTENT:\n{scrapedText}",
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

    public async Task<bool> ValidateEmailAsync(string email)
    {
        if (string.IsNullOrWhiteSpace(email)) return false;

        // Basic Regex checks
        if (!Regex.IsMatch(email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
        {
            return false;
        }

        try
        {
            var domain = email.Split('@').Last();
            var lookup = new LookupClient();
            var result = await lookup.QueryAsync(domain, QueryType.MX);
            return result.Answers.MxRecords().Any();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed MX lookup for {Email}", email);
            return false;
        }
    }
}
